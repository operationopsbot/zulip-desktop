import {ipcRenderer, remote} from "electron";

import {html} from "../../../../common/html";
import type {HTML} from "../../../../common/html";
import * as t from "../../../../common/translation-util";
import {generateNodeFromHTML} from "../../components/base";
import * as DomainUtil from "../../utils/domain-util";
import * as LinkUtil from "../../utils/link-util";

const {dialog} = remote;

interface NewServerFormProps {
  $root: Element;
  onChange: () => void;
}

export default class NewServerForm {
  props: NewServerFormProps;
  $newServerForm: Element;
  $saveServerButton: HTMLButtonElement;
  $newServerUrl: HTMLInputElement;
  constructor(props: NewServerFormProps) {
    this.props = props;
  }

  templateHTML(): HTML {
    return html`
      <div class="server-input-container">
        <div class="title">${t.__("Organization URL")}</div>
        <div class="add-server-info-row">
          <input
            class="setting-input-value"
            autofocus
            placeholder="your-organization.zulipchat.com or zulip.your-organization.com"
          />
        </div>
        <div class="server-center">
          <button id="connect">${t.__("Connect")}</button>
        </div>
        <div class="server-center">
          <div class="divider">
            <hr class="left" />
            ${t.__("OR")}
            <hr class="right" />
          </div>
        </div>
        <div class="server-center">
          <button id="open-create-org-link">
            ${t.__("Create a new organization")}
          </button>
        </div>
        <div class="server-center">
          <div class="server-network-option">
            <span id="open-network-settings"
              >${t.__("Network and Proxy Settings")}</span
            >
            <i class="material-icons open-network-button">open_in_new</i>
          </div>
        </div>
      </div>
    `;
  }

  init(): void {
    this.initForm();
    this.initActions();
  }

  initForm(): void {
    this.$newServerForm = generateNodeFromHTML(this.templateHTML());
    this.$saveServerButton = this.$newServerForm.querySelector("#connect");
    this.props.$root.textContent = "";
    this.props.$root.append(this.$newServerForm);
    this.$newServerUrl = this.$newServerForm.querySelector(
      "input.setting-input-value",
    );
  }

  async submitFormHandler(): Promise<void> {
    this.$saveServerButton.textContent = "Connecting...";
    let serverConf;
    try {
      serverConf = await DomainUtil.checkDomain(
        this.$newServerUrl.value.trim(),
      );
    } catch (error: unknown) {
      this.$saveServerButton.textContent = "Connect";
      await dialog.showMessageBox({
        type: "error",
        message:
          error instanceof Error
            ? `${error.name}: ${error.message}`
            : "Unknown error",
        buttons: ["OK"],
      });
      return;
    }

    await DomainUtil.addDomain(serverConf);
    this.props.onChange();
  }

  openCreateNewOrgExternalLink(): void {
    const link = "https://zulip.com/new/";
    const externalCreateNewOrgElement = document.querySelector(
      "#open-create-org-link",
    );
    externalCreateNewOrgElement.addEventListener("click", async () => {
      await LinkUtil.openBrowser(new URL(link));
    });
  }

  networkSettingsLink(): void {
    const networkSettingsId = document.querySelector(".server-network-option");
    networkSettingsId.addEventListener("click", () => {
      ipcRenderer.send("forward-message", "open-network-settings");
    });
  }

  initActions(): void {
    this.$saveServerButton.addEventListener("click", async () => {
      await this.submitFormHandler();
    });
    this.$newServerUrl.addEventListener("keypress", async (event) => {
      if (event.key === "Enter") {
        await this.submitFormHandler();
      }
    });
    // Open create new org link in default browser
    this.openCreateNewOrgExternalLink();
    this.networkSettingsLink();
  }
}
