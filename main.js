/*
THIS IS A GENERATED/BUNDLED FILE BY ESBUILD
if you want to view the source, please visit the github repository of this plugin
*/

var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => SymlinkPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var import_child_process = require("child_process");
var os = __toESM(require("os"));
var fs = __toESM(require("fs"));
var import_path = require("path");
var DEFAULT_SETTINGS = {
  defaultTargetPath: ""
};
var SymlinkPlugin = class extends import_obsidian.Plugin {
  async onload() {
    await this.loadSettings();
    this.addCommand({
      id: "create-symlink",
      name: "Create Symlink to Folder",
      callback: () => this.createSymlink()
    });
  }
  onunload() {
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  async createSymlink() {
    new SymlinkInputModal(this.app, (source, target, linkType) => {
      const platform2 = os.platform();
      if (!fs.existsSync(source)) {
        new import_obsidian.Notice(
          "Source path does not exist. Please ensure it does. Symlinks cannot be created if the source path does not exist."
        );
        return;
      }
      const targetPath = this.extendActivePath(target);
      if (fs.existsSync(targetPath)) {
        new import_obsidian.Notice(
          "Target path exist. Please ensure it does not. Symlinks cannot be created if the target path already exists."
        );
        return;
      }
      let command = "";
      switch (platform2) {
        case "win32":
          switch (linkType) {
            case "symlink":
              command = `mklink /D "${targetPath}" "${source}"`;
              break;
            case "junction":
              command = `mklink /J "${targetPath}" "${source}"`;
              break;
          }
          break;
        default:
          command = `ln -s "${source}" "${targetPath}"`;
          break;
      }
      (0, import_child_process.exec)(command, (error, stdout, stderr) => {
        if (error) {
          if (stderr) {
            console.error(`Error: ${stderr}`);
            new import_obsidian.Notice(`Error: ${stderr}`);
            return;
          }
        } else {
          new import_obsidian.Notice("Symlink created successfully.");
          this.refreshAfterSymlink(targetPath);
        }
      });
    }).open();
  }
  getActivePath() {
    const activeFile = this.app.workspace.getActiveFile();
    let relativePath;
    if (activeFile) {
      const currentPath = activeFile.path;
      relativePath = currentPath.substring(0, currentPath.lastIndexOf("/"));
    } else {
      relativePath = "";
    }
    return relativePath;
  }
  extendActivePath(name) {
    let relativePath = this.getActivePath();
    relativePath = (0, import_obsidian.normalizePath)((0, import_path.join)(relativePath, name));
    const vaultRootPath = this.app.vault.adapter.basePath;
    return (0, import_path.join)(vaultRootPath, relativePath);
  }
  async refreshVault() {
    await this.app.vault.adapter.list("");
  }
  async forceRefresh(path) {
    const folder = this.app.vault.getAbstractFileByPath(path);
    if (folder instanceof import_obsidian.TFolder) {
      this.app.vault.trigger("rename", folder, path);
    }
  }
  async refreshAfterSymlink(path) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    await this.refreshVault();
    await this.forceRefresh(path);
    this.app.vault;
    if (path.split("/").length === 1) {
      await this.forceRefresh("");
    }
  }
};
var SymlinkInputModal = class extends import_obsidian.Modal {
  constructor(app, onSubmit) {
    super(app);
    this.sourcePath = "";
    this.targetPath = "";
    this.linkType = "junction";
    this.onSubmit = onSubmit;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "Create Symlink" });
    new import_obsidian.Setting(contentEl).setName("Source Directory").setDesc(
      "This is the folder you want to create a symlink to. The source directory needs to exist."
    ).addButton(
      (button) => button.setButtonText("Choose Folder").setCta().onClick(async () => {
        const { remote } = window.require("electron");
        const selectedPaths = await remote.dialog.showOpenDialog({
          properties: ["openDirectory"]
        });
        if (selectedPaths && selectedPaths.filePaths.length > 0) {
          this.sourcePath = selectedPaths.filePaths[0];
          button.setButtonText((0, import_path.basename)(this.sourcePath));
        }
      })
    );
    new import_obsidian.Setting(contentEl).setName("Target Directory Path").setDesc(
      "This is the path where the symlink will be created. The target directory should not exist and will be newly created."
    ).addText((text) => text.onChange((value) => this.targetPath = value));
    if (os.platform() === "win32") {
      new import_obsidian.Setting(contentEl).setName("Link Type").setDesc("Choose the type of link to create.").addDropdown(
        (dropdown) => dropdown.addOption("junction", "Directory Junction (Default)").addOption("symlink", "Symbolic Link (Across volumes, but needs admin!)").setValue(this.linkType).onChange((value) => {
          this.linkType = value;
        })
      );
    }
    new import_obsidian.Setting(contentEl).addButton(
      (button) => button.setButtonText("Create").setCta().onClick(() => {
        if (this.sourcePath && this.targetPath) {
          this.onSubmit(this.sourcePath, this.targetPath, this.linkType);
          this.close();
        } else {
          new import_obsidian.Notice("Both paths are required.");
        }
      })
    );
  }
  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHtcclxuICBBcHAsXHJcbiAgTW9kYWwsXHJcbiAgTm90aWNlLFxyXG4gIFBsdWdpbixcclxuICBTZXR0aW5nLFxyXG4gIFRGb2xkZXIsXHJcbiAgbm9ybWFsaXplUGF0aCxcclxufSBmcm9tIFwib2JzaWRpYW5cIjtcclxuaW1wb3J0IHsgZXhlYyB9IGZyb20gXCJjaGlsZF9wcm9jZXNzXCI7XHJcbmltcG9ydCAqIGFzIG9zIGZyb20gXCJvc1wiO1xyXG5pbXBvcnQgKiBhcyBmcyBmcm9tIFwiZnNcIjtcclxuaW1wb3J0IHsgam9pbiwgYmFzZW5hbWUgfSBmcm9tIFwicGF0aFwiO1xyXG5cclxuLy8gUmVtZW1iZXIgdG8gcmVuYW1lIHRoZXNlIGNsYXNzZXMgYW5kIGludGVyZmFjZXMhXHJcblxyXG5pbnRlcmZhY2UgU3ltbGlua1BsdWdpblNldHRpbmdzIHtcclxuICBkZWZhdWx0VGFyZ2V0UGF0aDogc3RyaW5nO1xyXG59XHJcblxyXG5jb25zdCBERUZBVUxUX1NFVFRJTkdTOiBTeW1saW5rUGx1Z2luU2V0dGluZ3MgPSB7XHJcbiAgZGVmYXVsdFRhcmdldFBhdGg6IFwiXCIsXHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTeW1saW5rUGx1Z2luIGV4dGVuZHMgUGx1Z2luIHtcclxuICBzZXR0aW5nczogU3ltbGlua1BsdWdpblNldHRpbmdzO1xyXG5cclxuICBhc3luYyBvbmxvYWQoKSB7XHJcbiAgICBhd2FpdCB0aGlzLmxvYWRTZXR0aW5ncygpO1xyXG5cclxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XHJcbiAgICAgIGlkOiBcImNyZWF0ZS1zeW1saW5rXCIsXHJcbiAgICAgIG5hbWU6IFwiQ3JlYXRlIFN5bWxpbmsgdG8gRm9sZGVyXCIsXHJcbiAgICAgIGNhbGxiYWNrOiAoKSA9PiB0aGlzLmNyZWF0ZVN5bWxpbmsoKSxcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgb251bmxvYWQoKSB7fVxyXG5cclxuICBhc3luYyBsb2FkU2V0dGluZ3MoKSB7XHJcbiAgICB0aGlzLnNldHRpbmdzID0gT2JqZWN0LmFzc2lnbih7fSwgREVGQVVMVF9TRVRUSU5HUywgYXdhaXQgdGhpcy5sb2FkRGF0YSgpKTtcclxuICB9XHJcblxyXG4gIGFzeW5jIHNhdmVTZXR0aW5ncygpIHtcclxuICAgIGF3YWl0IHRoaXMuc2F2ZURhdGEodGhpcy5zZXR0aW5ncyk7XHJcbiAgfVxyXG5cclxuICBhc3luYyBjcmVhdGVTeW1saW5rKCkge1xyXG4gICAgbmV3IFN5bWxpbmtJbnB1dE1vZGFsKHRoaXMuYXBwLCAoc291cmNlLCB0YXJnZXQsIGxpbmtUeXBlKSA9PiB7XHJcbiAgICAgIC8vIERldGVybWluZSB0aGUgT1NcclxuICAgICAgY29uc3QgcGxhdGZvcm0gPSBvcy5wbGF0Zm9ybSgpO1xyXG5cclxuICAgICAgLy8gSW5zaWRlIGNyZWF0ZVN5bWxpbmsgb3Igd2l0aGluIHRoZSBtb2RhbCdzIG9uU3VibWl0XHJcbiAgICAgIGlmICghZnMuZXhpc3RzU3luYyhzb3VyY2UpKSB7XHJcbiAgICAgICAgbmV3IE5vdGljZShcclxuICAgICAgICAgIFwiU291cmNlIHBhdGggZG9lcyBub3QgZXhpc3QuIFBsZWFzZSBlbnN1cmUgaXQgZG9lcy4gU3ltbGlua3MgY2Fubm90IGJlIGNyZWF0ZWQgaWYgdGhlIHNvdXJjZSBwYXRoIGRvZXMgbm90IGV4aXN0LlwiLFxyXG4gICAgICAgICk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBHZXQgYWN0aXZlIGRpcmVjdG9yeSBwYXRoXHJcbiAgICAgIGNvbnN0IHRhcmdldFBhdGggPSB0aGlzLmV4dGVuZEFjdGl2ZVBhdGgodGFyZ2V0KTtcclxuXHJcbiAgICAgIGlmIChmcy5leGlzdHNTeW5jKHRhcmdldFBhdGgpKSB7XHJcbiAgICAgICAgbmV3IE5vdGljZShcclxuICAgICAgICAgIFwiVGFyZ2V0IHBhdGggZXhpc3QuIFBsZWFzZSBlbnN1cmUgaXQgZG9lcyBub3QuIFN5bWxpbmtzIGNhbm5vdCBiZSBjcmVhdGVkIGlmIHRoZSB0YXJnZXQgcGF0aCBhbHJlYWR5IGV4aXN0cy5cIixcclxuICAgICAgICApO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgbGV0IGNvbW1hbmQgPSBcIlwiO1xyXG5cclxuICAgICAgc3dpdGNoIChwbGF0Zm9ybSkge1xyXG4gICAgICAgIGNhc2UgXCJ3aW4zMlwiOlxyXG4gICAgICAgICAgc3dpdGNoIChsaW5rVHlwZSkge1xyXG4gICAgICAgICAgY2FzZSBcInN5bWxpbmtcIjpcclxuICAgICAgICAgICAgLy8gV2luZG93cyB1c2VzIG1rbGlua1xyXG4gICAgICAgICAgICAvLyBTeW50YXg6IG1rbGluayAvRCBcInRhcmdldFBhdGhcIiBcInNvdXJjZVBhdGhcIlxyXG4gICAgICAgICAgICBjb21tYW5kID0gYG1rbGluayAvRCBcIiR7dGFyZ2V0UGF0aH1cIiBcIiR7c291cmNlfVwiYDtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICBjYXNlIFwianVuY3Rpb25cIjpcclxuICAgICAgICAgICAgLy8gV2luZG93cyB1c2VzIG1rbGlua1xyXG4gICAgICAgICAgICAvLyBTeW50YXg6IG1rbGluayAvSiBcInRhcmdldFBhdGhcIiBcInNvdXJjZVBhdGhcIlxyXG4gICAgICAgICAgICBjb21tYW5kID0gYG1rbGluayAvSiBcIiR7dGFyZ2V0UGF0aH1cIiBcIiR7c291cmNlfVwiYDtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgLy8gVW5peC9MaW51eCB1c2VzIGxuIC1zXHJcbiAgICAgICAgICAvLyBTeW50YXg6IGxuIC1zIFwic291cmNlUGF0aFwiIFwidGFyZ2V0UGF0aFwiXHJcbiAgICAgICAgICBjb21tYW5kID0gYGxuIC1zIFwiJHtzb3VyY2V9XCIgXCIke3RhcmdldFBhdGh9XCJgO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIEV4ZWN1dGUgdGhlIGNvbW1hbmRcclxuICAgICAgZXhlYyhjb21tYW5kLCAoZXJyb3IsIHN0ZG91dCwgc3RkZXJyKSA9PiB7XHJcbiAgICAgICAgaWYgKGVycm9yKSB7XHJcbiAgICAgICAgICBpZiAoc3RkZXJyKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yOiAke3N0ZGVycn1gKTtcclxuICAgICAgICAgICAgbmV3IE5vdGljZShgRXJyb3I6ICR7c3RkZXJyfWApO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIG5ldyBOb3RpY2UoXCJTeW1saW5rIGNyZWF0ZWQgc3VjY2Vzc2Z1bGx5LlwiKTtcclxuICAgICAgICAgIHRoaXMucmVmcmVzaEFmdGVyU3ltbGluayh0YXJnZXRQYXRoKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfSkub3BlbigpO1xyXG4gIH1cclxuXHJcbiAgZ2V0QWN0aXZlUGF0aCgpOiBzdHJpbmcge1xyXG4gICAgY29uc3QgYWN0aXZlRmlsZSA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XHJcblxyXG4gICAgbGV0IHJlbGF0aXZlUGF0aDogc3RyaW5nO1xyXG5cclxuICAgIGlmIChhY3RpdmVGaWxlKSB7XHJcbiAgICAgIC8vIFVzZSB0aGUgcGFyZW50IGRpcmVjdG9yeSBvZiB0aGUgYWN0aXZlIGZpbGVcclxuICAgICAgY29uc3QgY3VycmVudFBhdGggPSBhY3RpdmVGaWxlLnBhdGg7XHJcbiAgICAgIHJlbGF0aXZlUGF0aCA9IGN1cnJlbnRQYXRoLnN1YnN0cmluZygwLCBjdXJyZW50UGF0aC5sYXN0SW5kZXhPZihcIi9cIikpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgLy8gVXNlIHRoZSByb290IG9mIHRoZSB2YXVsdFxyXG4gICAgICByZWxhdGl2ZVBhdGggPSBcIlwiO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlbGF0aXZlUGF0aDtcclxuICB9XHJcblxyXG4gIGV4dGVuZEFjdGl2ZVBhdGgobmFtZTogc3RyaW5nKTogc3RyaW5nIHtcclxuICAgIGxldCByZWxhdGl2ZVBhdGggPSB0aGlzLmdldEFjdGl2ZVBhdGgoKTtcclxuXHJcbiAgICAvLyBDb21iaW5lIHRoZSByZWxhdGl2ZSBwYXRoIHdpdGggdGhlIHByb3ZpZGVkIG5hbWVcclxuICAgIHJlbGF0aXZlUGF0aCA9IG5vcm1hbGl6ZVBhdGgoam9pbihyZWxhdGl2ZVBhdGgsIG5hbWUpKTtcclxuXHJcbiAgICAvLyBHZXQgdGhlIHZhdWx0J3Mgcm9vdCBwYXRoXHJcbiAgICBjb25zdCB2YXVsdFJvb3RQYXRoID0gKHRoaXMuYXBwLnZhdWx0LmFkYXB0ZXIgYXMgYW55KS5iYXNlUGF0aDtcclxuXHJcbiAgICAvLyBDb21iaW5lIHRoZSB2YXVsdCByb290IHBhdGggd2l0aCB0aGUgcmVsYXRpdmUgcGF0aFxyXG4gICAgcmV0dXJuIGpvaW4odmF1bHRSb290UGF0aCwgcmVsYXRpdmVQYXRoKTtcclxuICB9XHJcblxyXG4gIGFzeW5jIHJlZnJlc2hWYXVsdCgpIHtcclxuICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmFkYXB0ZXIubGlzdChcIlwiKTtcclxuICB9XHJcblxyXG4gIGFzeW5jIGZvcmNlUmVmcmVzaChwYXRoOiBzdHJpbmcpIHtcclxuICAgIGNvbnN0IGZvbGRlciA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChwYXRoKTtcclxuICAgIGlmIChmb2xkZXIgaW5zdGFuY2VvZiBURm9sZGVyKSB7XHJcbiAgICAgIHRoaXMuYXBwLnZhdWx0LnRyaWdnZXIoXCJyZW5hbWVcIiwgZm9sZGVyLCBwYXRoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGFzeW5jIHJlZnJlc2hBZnRlclN5bWxpbmsocGF0aDogc3RyaW5nKSB7XHJcbiAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4gc2V0VGltZW91dChyZXNvbHZlLCAxMDApKTsgLy8gV2FpdCAxMDBtc1xyXG4gICAgYXdhaXQgdGhpcy5yZWZyZXNoVmF1bHQoKTtcclxuICAgIGF3YWl0IHRoaXMuZm9yY2VSZWZyZXNoKHBhdGgpO1xyXG5cclxuICAgIHRoaXMuYXBwLnZhdWx0O1xyXG5cclxuICAgIGlmIChwYXRoLnNwbGl0KFwiL1wiKS5sZW5ndGggPT09IDEpIHtcclxuICAgICAgYXdhaXQgdGhpcy5mb3JjZVJlZnJlc2goXCJcIik7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5jbGFzcyBTeW1saW5rSW5wdXRNb2RhbCBleHRlbmRzIE1vZGFsIHtcclxuICBzb3VyY2VQYXRoID0gXCJcIjtcclxuICB0YXJnZXRQYXRoID0gXCJcIjtcclxuICBsaW5rVHlwZSA9IFwianVuY3Rpb25cIjtcclxuICBvblN1Ym1pdDogKHNvdXJjZTogc3RyaW5nLCB0YXJnZXQ6IHN0cmluZywgc3ltbGluazogc3RyaW5nKSA9PiB2b2lkO1xyXG5cclxuICBjb25zdHJ1Y3RvcihcclxuICAgIGFwcDogQXBwLFxyXG4gICAgb25TdWJtaXQ6IChzb3VyY2U6IHN0cmluZywgdGFyZ2V0OiBzdHJpbmcsIHN5bWxpbms6IHN0cmluZykgPT4gdm9pZCxcclxuICApIHtcclxuICAgIHN1cGVyKGFwcCk7XHJcbiAgICB0aGlzLm9uU3VibWl0ID0gb25TdWJtaXQ7XHJcbiAgfVxyXG5cclxuICBvbk9wZW4oKSB7XHJcbiAgICBjb25zdCB7IGNvbnRlbnRFbCB9ID0gdGhpcztcclxuICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogXCJDcmVhdGUgU3ltbGlua1wiIH0pO1xyXG5cclxuICAgIG5ldyBTZXR0aW5nKGNvbnRlbnRFbClcclxuICAgICAgLnNldE5hbWUoXCJTb3VyY2UgRGlyZWN0b3J5XCIpXHJcbiAgICAgIC5zZXREZXNjKFxyXG4gICAgICAgIFwiVGhpcyBpcyB0aGUgZm9sZGVyIHlvdSB3YW50IHRvIGNyZWF0ZSBhIHN5bWxpbmsgdG8uIFRoZSBzb3VyY2UgZGlyZWN0b3J5IG5lZWRzIHRvIGV4aXN0LlwiLFxyXG4gICAgICApXHJcbiAgICAgIC5hZGRCdXR0b24oKGJ1dHRvbikgPT5cclxuICAgICAgICBidXR0b25cclxuICAgICAgICAgIC5zZXRCdXR0b25UZXh0KFwiQ2hvb3NlIEZvbGRlclwiKVxyXG4gICAgICAgICAgLnNldEN0YSgpXHJcbiAgICAgICAgICAub25DbGljayhhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHsgcmVtb3RlIH0gPSB3aW5kb3cucmVxdWlyZShcImVsZWN0cm9uXCIpO1xyXG4gICAgICAgICAgICBjb25zdCBzZWxlY3RlZFBhdGhzID0gYXdhaXQgcmVtb3RlLmRpYWxvZy5zaG93T3BlbkRpYWxvZyh7XHJcbiAgICAgICAgICAgICAgcHJvcGVydGllczogW1wib3BlbkRpcmVjdG9yeVwiXSxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGlmIChzZWxlY3RlZFBhdGhzICYmIHNlbGVjdGVkUGF0aHMuZmlsZVBhdGhzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICB0aGlzLnNvdXJjZVBhdGggPSBzZWxlY3RlZFBhdGhzLmZpbGVQYXRoc1swXTtcclxuICAgICAgICAgICAgICAvLyBVcGRhdGUgdGhlIGJ1dHRvbiB0ZXh0IG9yIGFkZCBhIG5vdGljZVxyXG4gICAgICAgICAgICAgIGJ1dHRvbi5zZXRCdXR0b25UZXh0KGJhc2VuYW1lKHRoaXMuc291cmNlUGF0aCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KSxcclxuICAgICAgKTtcclxuXHJcbiAgICBuZXcgU2V0dGluZyhjb250ZW50RWwpXHJcbiAgICAgIC5zZXROYW1lKFwiVGFyZ2V0IERpcmVjdG9yeSBQYXRoXCIpXHJcbiAgICAgIC5zZXREZXNjKFxyXG4gICAgICAgIFwiVGhpcyBpcyB0aGUgcGF0aCB3aGVyZSB0aGUgc3ltbGluayB3aWxsIGJlIGNyZWF0ZWQuIFRoZSB0YXJnZXQgZGlyZWN0b3J5IHNob3VsZCBub3QgZXhpc3QgYW5kIHdpbGwgYmUgbmV3bHkgY3JlYXRlZC5cIixcclxuICAgICAgKVxyXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT4gdGV4dC5vbkNoYW5nZSgodmFsdWUpID0+ICh0aGlzLnRhcmdldFBhdGggPSB2YWx1ZSkpKTtcclxuXHJcbiAgICAvLyBMaW5rIFR5cGUgRHJvcGRvd24gKFdpbmRvd3MgT25seSlcclxuICAgIGlmIChvcy5wbGF0Zm9ybSgpID09PSBcIndpbjMyXCIpIHtcclxuICAgICAgbmV3IFNldHRpbmcoY29udGVudEVsKVxyXG4gICAgICAgIC5zZXROYW1lKFwiTGluayBUeXBlXCIpXHJcbiAgICAgICAgLnNldERlc2MoXCJDaG9vc2UgdGhlIHR5cGUgb2YgbGluayB0byBjcmVhdGUuXCIpXHJcbiAgICAgICAgLmFkZERyb3Bkb3duKChkcm9wZG93bikgPT5cclxuICAgICAgICAgIGRyb3Bkb3duXHJcbiAgICAgICAgICAgIC5hZGRPcHRpb24oXCJqdW5jdGlvblwiLCBcIkRpcmVjdG9yeSBKdW5jdGlvbiAoRGVmYXVsdClcIilcclxuICAgICAgICAgICAgLmFkZE9wdGlvbihcInN5bWxpbmtcIiwgXCJTeW1ib2xpYyBMaW5rIChBY3Jvc3Mgdm9sdW1lcywgYnV0IG5lZWRzIGFkbWluISlcIilcclxuICAgICAgICAgICAgLnNldFZhbHVlKHRoaXMubGlua1R5cGUpXHJcbiAgICAgICAgICAgIC5vbkNoYW5nZSgodmFsdWUpID0+IHtcclxuICAgICAgICAgICAgICB0aGlzLmxpbmtUeXBlID0gdmFsdWUgYXMgXCJqdW5jdGlvblwiIHwgXCJzeW1saW5rXCI7XHJcbiAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgbmV3IFNldHRpbmcoY29udGVudEVsKS5hZGRCdXR0b24oKGJ1dHRvbikgPT5cclxuICAgICAgYnV0dG9uXHJcbiAgICAgICAgLnNldEJ1dHRvblRleHQoXCJDcmVhdGVcIilcclxuICAgICAgICAuc2V0Q3RhKClcclxuICAgICAgICAub25DbGljaygoKSA9PiB7XHJcbiAgICAgICAgICBpZiAodGhpcy5zb3VyY2VQYXRoICYmIHRoaXMudGFyZ2V0UGF0aCkge1xyXG4gICAgICAgICAgICB0aGlzLm9uU3VibWl0KHRoaXMuc291cmNlUGF0aCwgdGhpcy50YXJnZXRQYXRoLCB0aGlzLmxpbmtUeXBlKTtcclxuICAgICAgICAgICAgdGhpcy5jbG9zZSgpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbmV3IE5vdGljZShcIkJvdGggcGF0aHMgYXJlIHJlcXVpcmVkLlwiKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KSxcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBvbkNsb3NlKCkge1xyXG4gICAgY29uc3QgeyBjb250ZW50RWwgfSA9IHRoaXM7XHJcbiAgICBjb250ZW50RWwuZW1wdHkoKTtcclxuICB9XHJcbn1cclxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxzQkFRTztBQUNQLDJCQUFxQjtBQUNyQixTQUFvQjtBQUNwQixTQUFvQjtBQUNwQixrQkFBK0I7QUFRL0IsSUFBTSxtQkFBMEM7QUFBQSxFQUM5QyxtQkFBbUI7QUFDckI7QUFFQSxJQUFxQixnQkFBckIsY0FBMkMsdUJBQU87QUFBQSxFQUdoRCxNQUFNLFNBQVM7QUFDYixVQUFNLEtBQUssYUFBYTtBQUV4QixTQUFLLFdBQVc7QUFBQSxNQUNkLElBQUk7QUFBQSxNQUNKLE1BQU07QUFBQSxNQUNOLFVBQVUsTUFBTSxLQUFLLGNBQWM7QUFBQSxJQUNyQyxDQUFDO0FBQUEsRUFDSDtBQUFBLEVBRUEsV0FBVztBQUFBLEVBQUM7QUFBQSxFQUVaLE1BQU0sZUFBZTtB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QUFDYixvQkFBVztBQVFULFNBQUssV0FBVztBQUFBLEVBQ2xCO0FBQUEsRUFFQSxTQUFTO0FBQ1AsVUFBTSxFQUFFLFVBQVUsSUFBSTtBQUN0QixjQUFVLFNBQVMsTUFBTSxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFFbkQsUUFBSSx3QkFBUSxTQUFTLEVBQ2xCLFFBQVEsa0JBQWtCLEVBQzFCO0FBQUEsTUFDQztBQUFBLElBQ0YsRUFDQztBQUFBLE1BQVUsQ0FBQyxXQUNWLE9BQ0csY0FBYyxlQUFlLEVBQzdCLE9BQU8sRUFDUCxRQUFRLFlBQVk7QUFDbkIsY0FBTSxFQUFFLE9BQU8sSUFBSSxPQUFPLFFBQVEsVUFBVTtBQUM1QyxjQUFNLGdCQUFnQixNQUFNLE9BQU8sT0FBTyxlQUFlO0FBQUEsVUFDdkQsWUFBWSxDQUFDLGVBQWU7QUFBQSxRQUM5QixDQUFDO0FBQ0QsWUFBSSxpQkFBaUIsY0FBYyxVQUFVLFNBQVMsR0FBRztBQUN2RCxlQUFLLGFBQWEsY0FBYyxVQUFVLENBQUM7QUFFM0MsaUJBQU8sa0JBQWMsc0JBQVMsS0FBSyxVQUFVLENBQUM7QUFBQSxRQUNoRDtBQUFBLE1BQ0YsQ0FBQztBQUFBLElBQ0w7QUFFRixRQUFJLHdCQUFRLFNBQVMsRUFDbEIsUUFBUSx1QkFBdUIsRUFDL0I7QUFBQSxNQUNDO0FBQUEsSUFDRixFQUNDLFFBQVEsQ0FBQyxTQUFTLEtBQUssU0FBUyxDQUFDLFVBQVcsS0FBSyxhQUFhLEtBQU0sQ0FBQztBQUd4RSxRQUFPLFlBQVMsTUFBTSxTQUFTO0FBQzdCLFVBQUksd0JBQVEsU0FBUyxFQUNsQixRQUFRLFdBQVcsRUFDbkIsUUFBUSxvQ0FBb0MsRUFDNUM7QUFBQSxRQUFZLENBQUMsYUFDWixTQUNHLFVBQVUsWUFBWSw4QkFBOEIsRUFDcEQsVUFBVSxXQUFXLGtEQUFrRCxFQUN2RSxTQUFTLEtBQUssUUFBUSxFQUN0QixTQUFTLENBQUMsVUFBVTtBQUNuQixlQUFLLFdBQVc7QUFBQSxRQUNsQixDQUFDO0FBQUEsTUFDTDtBQUFBLElBQ0o7QUFFQSxRQUFJLHdCQUFRLFNBQVMsRUFBRTtBQUFBLE1BQVUsQ0FBQyxXQUNoQyxPQUNHLGNBQWMsUUFBUSxFQUN0QixPQUFPLEVBQ1AsUUFBUSxNQUFNO0FBQ2IsWUFBSSxLQUFLLGNBQWMsS0FBSyxZQUFZO0FBQ3RDLGVBQUssU0FBUyxLQUFLLFlBQVksS0FBSyxZQUFZLEtBQUssUUFBUTtBQUM3RCxlQUFLLE1BQU07QUFBQSxRQUNiLE9BQU87QUFDTCxjQUFJLHVCQUFPLDBCQUEwQjtBQUFBLFFBQ3ZDO0FBQUEsTUFDRixDQUFDO0FBQUEsSUFDTDtBQUFBLEVBQ0Y7QUFBQSxFQUVBLFVBQVU7QUFDUixVQUFNLEVBQUUsVUFBVSxJQUFJO0FBQ3RCLGNBQVUsTUFBTTtBQUFBLEVBQ2xCO0FBQ0Y7IiwKICAibmFtZXMiOiBbInBsYXRmb3JtIl0KfQo=