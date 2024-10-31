import {
  App,
  Modal,
  Notice,
  Plugin,
  Setting,
  TFolder,
  Platform,
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
      name: "Creates a symlink to a folder",
      callback: () => this.createSymlink(),
    });

    this.addCommand({
      id: "create-symlink-file",
      name: "Creates a symlink to a file",
      callback: () => this.createSymlinkFile(),
    });
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async createSymlinkFile() {
    if (!Platform.isDesktop) {
      new Notice("This plugin only works on desktop.");
      return;
    }

    new SymlinkFileInputModal(this.app, (source, target) => {
      // Inside createSymlink or within the modal's onSubmit
      if (!fs.existsSync(source)) {
        new Notice(
          "Source file path does not exist. Please ensure it does. Symlinks cannot be created if the source file path does not exist.",
        );
        return;
      }

      // Get active directory path
      const targetPath = this.extendActivePath(target);

      if (fs.existsSync(targetPath)) {
        new Notice(
          "Target file path exist. Please ensure it does not. Symlinks cannot be created if the target file path already exists.",
        );
        return;
      }

      let command = "";

      if (Platform.isWin) {
        command = `mklink "${targetPath}" "${source}"`;
      } else if (Platform.isLinux || Platform.isMacOS) {
        command = `ln -s "${source}" "${targetPath}"`;
      } else {
        new Notice("Unsupported platform.");
        return;
      }

      // Execute the command
      exec(command, (error, stdout, stderr) => {
        if (error) {
          if (stderr) {
            console.error(`Error: ${stderr}`);
            new Notice(`Error: ${stderr}`);
            return;
          }
        } else {
          new Notice("Symlink created successfully.");
          this.refreshAfterSymlink(targetPath);
        }
      });
    }).open();
  }

  async createSymlink() {
    if (!Platform.isDesktop) {
      new Notice("This plugin only works on desktop.");
      return;
    }

    new SymlinkInputModal(this.app, (source, target, linkType) => {
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

      if (Platform.isWin) {
        switch (linkType) {
          case "symlink":
            // Windows uses mklink
            // Syntax: mklink /D "targetPath" "sourcePath"
            command = `mklink /D "${targetPath}" "${source}"`;
            break;
          case "junction":
            // Windows uses mklink
            // Syntax: mklink /J "targetPath" "sourcePath"
            command = `mklink /J "${targetPath}" "${source}"`;
            break;
        }
      } else if (Platform.isLinux || Platform.isMacOS) {
        // Unix/Linux uses ln -s
        // Syntax: ln -s "sourcePath" "targetPath"
        command = `ln -s "${source}" "${targetPath}"`;
      } else {
        new Notice("Unsupported platform.");
        return;
      }

      // Execute the command
      exec(command, (error, stdout, stderr) => {
        if (error) {
          if (stderr) {
            console.error(`Error: ${stderr}`);
            new Notice(`Error: ${stderr}`);
            return;
          }
        } else {
          new Notice("Symlink created successfully.");
          this.refreshAfterSymlink(targetPath);
        }
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
  linkType = "junction";
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
    contentEl.createEl("h2", { text: "Create symlink" });

    new Setting(contentEl)
      .setName("Source directory")
      .setDesc(
        "This is the folder you want to create a symlink to. The source directory needs to exist.",
      )
      .addButton((button) =>
        button
          .setButtonText("Choose folder")
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
      .setName("Target directory path")
      .setDesc(
        "This is the path where the symlink will be created. The target directory should not exist and will be newly created.",
      )
      .addText((text) => text.onChange((value) => (this.targetPath = value)));

    // Link Type Dropdown (Windows Only)
    if (Platform.isWin) {
      new Setting(contentEl)
        .setName("Link type")
        .setDesc("Choose the type of link to create.")
        .addDropdown((dropdown) =>
          dropdown
            .addOption("junction", "Directory junction (default)")
            .addOption(
              "symlink",
              "Symbolic link (across volumes, but needs admin!)",
            )
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

class SymlinkFileInputModal extends Modal {
  sourcePath = "";
  targetPath = "";
  onSubmit: (source: string, target: string) => void;

  constructor(app: App, onSubmit: (source: string, target: string) => void) {
    super(app);
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "Create symlink" });

    let sourceDesc =
      "This is the file you want to create a symlink to. The source file needs to exist.";
    if (Platform.isWin) {
      sourceDesc +=
        " Please note: You need to activate 'Developer Mode' or need admin rights to create symlinks on Windows!";
    }

    new Setting(contentEl)
      .setName("Source file")
      .setDesc(sourceDesc)
      .addButton((button) =>
        button
          .setButtonText("Choose file")
          .setCta()
          .onClick(async () => {
            const { remote } = window.require("electron");
            const selectedPaths = await remote.dialog.showOpenDialog({
              properties: ["openFile"],
            });
            if (selectedPaths && selectedPaths.filePaths.length > 0) {
              this.sourcePath = selectedPaths.filePaths[0];
              // Update the button text or add a notice
              button.setButtonText(basename(this.sourcePath));
            }
          }),
      );

    new Setting(contentEl)
      .setName("Target file path")
      .setDesc(
        "This is the path where the symlink will be created. The target file path should not exist and will be newly created.",
      )
      .addText((text) => text.onChange((value) => (this.targetPath = value)));

    new Setting(contentEl).addButton((button) =>
      button
        .setButtonText("Create")
        .setCta()
        .onClick(() => {
          if (this.sourcePath && this.targetPath) {
            this.onSubmit(this.sourcePath, this.targetPath);
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
