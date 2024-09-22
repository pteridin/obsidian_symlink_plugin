import {
  App,
  Modal,
  Notice,
  Plugin,
  Setting,
  TFolder,
  normalizePath,
} from "obsidian";
import { exec } from "child_process";
import * as os from "os";
import * as fs from "fs";
import { join, basename } from "path";

// Remember to rename these classes and interfaces!

interface SymlinkPluginSettings {
  defaultTargetPath: string;
}

const DEFAULT_SETTINGS: SymlinkPluginSettings = {
  defaultTargetPath: "",
};

export default class SymlinkPlugin extends Plugin {
  settings: SymlinkPluginSettings;

  async onload() {
    await this.loadSettings();

    this.addCommand({
      id: "create-symlink",
      name: "Create Symlink to Folder",
      callback: () => this.createSymlink(),
    });
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async createSymlink() {
    new SymlinkInputModal(this.app, (source, target, linkType) => {
      // Determine the OS
      const platform = os.platform();

      // Inside createSymlink or within the modal's onSubmit
      if (!fs.existsSync(source)) {
        new Notice(
          "Source path does not exist. Please ensure it does. Symlinks cannot be created if the source path does not exist.",
        );
        return;
      }

      // Get active directory path
      const targetPath = this.extendActivePath(target);

      if (fs.existsSync(targetPath)) {
        new Notice(
          "Target path exist. Please ensure it does not. Symlinks cannot be created if the target path already exists.",
        );
        return;
      }

      let command = "";

      if (platform === "win32" && linkType === "symlink") {
        // Windows uses mklink
        // Syntax: mklink /D "targetPath" "sourcePath"
        command = `mklink /D "${targetPath}" "${source}"`;
      }
      if (platform === "win32" && linkType === "junction") {
        // Windows uses mklink
        // Syntax: mklink /J "targetPath" "sourcePath"
        command = `mklink /J "${targetPath}" "${source}"`;
      } else {
        // Unix/Linux uses ln -s
        // Syntax: ln -s "sourcePath" "targetPath"
        command = `ln -s "${source}" "${targetPath}"`;
      }

      // Execute the command
      exec(command, (error, stdout, stderr) => {
        if (error) {
          if (platform === "win32" && error.message.includes("permission")) {
            // If permission denied on Windows, try creating a junction
            //isSymlink = false;
            const junctionCommand = `mklink /J "${targetPath}" "${source}"`;
            exec(
              junctionCommand,
              (junctionError, junctionStdout, junctionStderr) => {
                if (junctionError) {
                  console.error(
                    `Error creating junction: ${junctionError.message}`,
                  );
                  new Notice(
                    `Error creating symlink/junction: ${junctionError.message}`,
                  );
                  return;
                }
                if (junctionStderr) {
                  console.error(`Error: ${junctionStderr}`);
                  new Notice(`Error: ${junctionStderr}`);
                  return;
                }
                console.log(`Junction created successfully: ${junctionStdout}`);
                new Notice("Junction created successfully.");
              },
            );
            return;
          }

          console.error(`Error creating symlink: ${error.message}`);
          new Notice(`Error creating symlink: ${error.message}`);
          return;
        }
        if (stderr) {
          console.error(`Error: ${stderr}`);
          new Notice(`Error: ${stderr}`);
          return;
        }
        new Notice("Symlink created successfully.");

        this.refreshAfterSymlink(targetPath);
      });
    }).open();
  }

  getActivePath(): string {
    const activeFile = this.app.workspace.getActiveFile();

    let relativePath: string;

    if (activeFile) {
      // Use the parent directory of the active file
      const currentPath = activeFile.path;
      relativePath = currentPath.substring(0, currentPath.lastIndexOf("/"));
    } else {
      // Use the root of the vault
      relativePath = "";
    }
    return relativePath;
  }

  extendActivePath(name: string): string {
    let relativePath = this.getActivePath();

    // Combine the relative path with the provided name
    relativePath = normalizePath(join(relativePath, name));

    // Get the vault's root path
    const vaultRootPath = (this.app.vault.adapter as any).basePath;

    // Combine the vault root path with the relative path
    return join(vaultRootPath, relativePath);
  }

  async refreshVault() {
    await this.app.vault.adapter.list("");
  }

  async forceRefresh(path: string) {
    const folder = this.app.vault.getAbstractFileByPath(path);
    if (folder instanceof TFolder) {
      this.app.vault.trigger("rename", folder, path);
    }
  }

  async refreshAfterSymlink(path: string) {
    await new Promise((resolve) => setTimeout(resolve, 100)); // Wait 100ms
    await this.refreshVault();
    await this.forceRefresh(path);

    this.app.vault;

    if (path.split("/").length === 1) {
      await this.forceRefresh("");
    }
  }
}

class SymlinkInputModal extends Modal {
  sourcePath = "";
  targetPath = "";
  linkType = "symlink";
  onSubmit: (source: string, target: string, symlink: string) => void;

  constructor(
    app: App,
    onSubmit: (source: string, target: string, symlink: string) => void,
  ) {
    super(app);
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "Create Symlink" });

    new Setting(contentEl)
      .setName("Source Directory")
      .setDesc(
        "This is the folder you want to create a symlink to. The source directory needs to exist.",
      )
      .addButton((button) =>
        button
          .setButtonText("Choose Folder")
          .setCta()
          .onClick(async () => {
            const { remote } = window.require("electron");
            const selectedPaths = await remote.dialog.showOpenDialog({
              properties: ["openDirectory"],
            });
            if (selectedPaths && selectedPaths.filePaths.length > 0) {
              this.sourcePath = selectedPaths.filePaths[0];
              // Update the button text or add a notice
              button.setButtonText(basename(this.sourcePath));
            }
          }),
      );

    new Setting(contentEl)
      .setName("Target Directory Path")
      .setDesc(
        "This is the path where the symlink will be created. The target directory should not exist and will be newly created.",
      )
      .addText((text) => text.onChange((value) => (this.targetPath = value)));

    // Link Type Dropdown (Windows Only)
    if (os.platform() === "win32") {
      new Setting(contentEl)
        .setName("Link Type")
        .setDesc("Choose the type of link to create.")
        .addDropdown((dropdown) =>
          dropdown
            .addOption("junction", "Directory Junction (Needs Admin)")
            .addOption("symlink", "Symbolic Link (Default)")
            .setValue(this.linkType)
            .onChange((value) => {
              this.linkType = value as "junction" | "symlink";
            }),
        );
    }

    new Setting(contentEl).addButton((button) =>
      button
        .setButtonText("Create")
        .setCta()
        .onClick(() => {
          if (this.sourcePath && this.targetPath) {
            this.onSubmit(this.sourcePath, this.targetPath, this.linkType);
            this.close();
          } else {
            new Notice("Both paths are required.");
          }
        }),
    );
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
