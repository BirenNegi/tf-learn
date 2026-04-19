// Simulated Terraform terminal responses per day
// Each day has: files (virtual filesystem), commands (command -> output map)

const ANSI = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  green:  '\x1b[32m',
  red:    '\x1b[31m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  white:  '\x1b[37m',
  gray:   '\x1b[90m',
  bgreen: '\x1b[1;32m',
  bred:   '\x1b[1;31m',
  byellow:'\x1b[1;33m',
  bcyan:  '\x1b[1;36m',
};

const G = ANSI.green, R = ANSI.red, Y = ANSI.yellow,
      C = ANSI.cyan,  W = ANSI.white, GR= ANSI.gray,
      BG= ANSI.bgreen,BR= ANSI.bred,  BY= ANSI.byellow,
      BC= ANSI.bcyan, RST= ANSI.reset, B= ANSI.bold;

// ─── shared helpers ───────────────────────────────────────────────────────────
function initOutput(providers = ['azurerm']) {
  const lines = [
    `${B}Initializing the backend...${RST}`,
    ``,
    `${B}Initializing provider plugins...${RST}`,
  ];
  providers.forEach(p => {
    lines.push(`- Finding hashicorp/${p} versions matching "~> ${p === 'azurerm' ? '3.85' : p === 'azuread' ? '2.47' : '3.5'}"...`);
    lines.push(`- Installing hashicorp/${p} v${p === 'azurerm' ? '3.85.0' : p === 'azuread' ? '2.47.0' : '3.6.1'}...`);
    lines.push(`- Installed hashicorp/${p} v${p === 'azurerm' ? '3.85.0' : p === 'azuread' ? '2.47.0' : '3.6.1'} (signed by HashiCorp)`);
  });
  lines.push(``);
  lines.push(`Terraform has created a lock file ${C}.terraform.lock.hcl${RST} to record the provider`);
  lines.push(`selections it made above. Include this file in your version control repository`);
  lines.push(`so that Terraform can guarantee to make the same selections by default when`);
  lines.push(`you run "terraform init" in the future.`);
  lines.push(``);
  lines.push(`${BG}Terraform has been successfully initialized!${RST}`);
  lines.push(``);
  lines.push(`You may now begin working with Terraform. Try running "terraform plan" to see`);
  lines.push(`any changes that are required for your infrastructure. All Terraform commands`);
  lines.push(`should now work.`);
  return lines.join('\n');
}

function fmtOutput(changed = false) {
  if (changed) return `${Y}main.tf${RST}\n${Y}variables.tf${RST}`;
  return '';
}

function validateOutput() {
  return `${BG}Success!${RST} The configuration is valid.`;
}

function destroyConfirm(resources) {
  return [
    `${BR}Destroy complete! Resources: ${resources} destroyed.${RST}`,
  ].join('\n');
}

// ─── per-day terminal config ──────────────────────────────────────────────────
const terminalDays = {

  1: {
    title: 'Terraform & IaC Fundamentals',
    files: {
      'main.tf': `terraform {
  required_version = ">= 1.5.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.85"
    }
  }
}

provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "main" {
  name     = "rg-myapp-dev-eus"
  location = "East US"
  tags = {
    environment = "dev"
    managed_by  = "terraform"
  }
}

output "rg_name" {
  value = azurerm_resource_group.main.name
}`,
    },
    state: {
      resources: ['azurerm_resource_group.main'],
      applied: false,
    },
    commands: {
      'terraform -version': () =>
        `${BG}Terraform v1.7.0${RST}\non linux_amd64\n\nYour version of Terraform is up to date.`,

      'terraform init': () => initOutput(['azurerm']),

      'terraform validate': () => validateOutput(),

      'terraform fmt': () => fmtOutput(false),

      'terraform fmt -check': () => ``,

      'terraform plan': (state) => {
        if (!state.initialized) return `${BR}Error:${RST} Backend not initialized. Run ${C}terraform init${RST} first.`;
        return [
          `${B}Terraform used the selected providers to generate the following execution plan.${RST}`,
          `Resource actions are indicated with the following symbols:`,
          `  ${G}+${RST} create`,
          ``,
          `Terraform will perform the following actions:`,
          ``,
          `  ${G}# azurerm_resource_group.main${RST} will be created`,
          `  ${G}+${RST} resource "azurerm_resource_group" "main" {`,
          `      ${G}+${RST} id       = (known after apply)`,
          `      ${G}+${RST} location = "eastus"`,
          `      ${G}+${RST} name     = "rg-myapp-dev-eus"`,
          `      ${G}+${RST} tags     = {`,
          `          ${G}+${RST} "environment" = "dev"`,
          `          ${G}+${RST} "managed_by"  = "terraform"`,
          `        }`,
          `    }`,
          ``,
          `${BY}Plan:${RST} 1 to add, 0 to change, 0 to destroy.`,
          ``,
          `Changes to Outputs:`,
          `  ${G}+${RST} rg_name = "rg-myapp-dev-eus"`,
          ``,
          `${GR}────────────────────────────────────────────────────────────────${RST}`,
          `${GR}Note: You didn't use the -out option to save this plan, so Terraform${RST}`,
          `${GR}can't guarantee to take exactly these actions if you run "terraform apply" now.${RST}`,
        ].join('\n');
      },

      'terraform apply': (state) => {
        if (!state.initialized) return `${BR}Error:${RST} Run ${C}terraform init${RST} first.`;
        if (state.applied) return [
          `${B}azurerm_resource_group.main: Refreshing state...${RST}`,
          ``,
          `No changes. Your infrastructure matches the configuration.`,
          ``,
          `Terraform has compared your real infrastructure against your configuration`,
          `and found no differences, so no changes are needed.`,
          ``,
          `${BG}Apply complete! Resources: 0 added, 0 changed, 0 destroyed.${RST}`,
        ].join('\n');
        state.applied = true;
        return [
          `${B}Terraform used the selected providers to generate the following execution plan.${RST}`,
          ``,
          `  ${G}# azurerm_resource_group.main${RST} will be created`,
          `  ${G}+${RST} resource "azurerm_resource_group" "main" {`,
          `      ${G}+${RST} id       = (known after apply)`,
          `      ${G}+${RST} location = "eastus"`,
          `      ${G}+${RST} name     = "rg-myapp-dev-eus"`,
          `    }`,
          ``,
          `${BY}Plan:${RST} 1 to add, 0 to change, 0 to destroy.`,
          ``,
          `Do you want to perform these actions?`,
          `  Terraform will perform the actions described above.`,
          `  Only 'yes' will be accepted to approve.`,
          ``,
          `  ${C}Enter a value:${RST} yes`,
          ``,
          `azurerm_resource_group.main: Creating...`,
          `azurerm_resource_group.main: Creation complete after 2s`,
          `  ${GR}[id=/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg-myapp-dev-eus]${RST}`,
          ``,
          `${BG}Apply complete! Resources: 1 added, 0 changed, 0 destroyed.${RST}`,
          ``,
          `Outputs:`,
          ``,
          `rg_name = "rg-myapp-dev-eus"`,
        ].join('\n');
      },

      'terraform apply -auto-approve': (state) => {
        state.applied = true;
        return [
          `azurerm_resource_group.main: Creating...`,
          `azurerm_resource_group.main: Creation complete after 2s`,
          `  ${GR}[id=/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg-myapp-dev-eus]${RST}`,
          ``,
          `${BG}Apply complete! Resources: 1 added, 0 changed, 0 destroyed.${RST}`,
          ``,
          `Outputs:`,
          `rg_name = "rg-myapp-dev-eus"`,
        ].join('\n');
      },

      'terraform output': (state) => {
        if (!state.applied) return `${BR}Error:${RST} No state found. Run ${C}terraform apply${RST} first.`;
        return `rg_name = "rg-myapp-dev-eus"`;
      },

      'terraform output rg_name': (state) => {
        if (!state.applied) return `${BR}Error:${RST} No state found.`;
        return `"rg-myapp-dev-eus"`;
      },

      'terraform state list': (state) => {
        if (!state.applied) return `${GR}No state found. Run terraform apply first.${RST}`;
        return `azurerm_resource_group.main`;
      },

      'terraform state show azurerm_resource_group.main': (state) => {
        if (!state.applied) return `${BR}Error:${RST} Resource not found in state.`;
        return [
          `# azurerm_resource_group.main:`,
          `resource "azurerm_resource_group" "main" {`,
          `    id       = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg-myapp-dev-eus"`,
          `    location = "eastus"`,
          `    name     = "rg-myapp-dev-eus"`,
          `    tags     = {`,
          `        "environment" = "dev"`,
          `        "managed_by"  = "terraform"`,
          `    }`,
          `}`,
        ].join('\n');
      },

      'terraform destroy': (state) => {
        if (!state.applied) return `${GR}Nothing to destroy.${RST}`;
        state.applied = false;
        return [
          `azurerm_resource_group.main: Refreshing state...`,
          ``,
          `Terraform used the selected providers to generate the following execution plan.`,
          ``,
          `  ${R}# azurerm_resource_group.main${RST} will be destroyed`,
          `  ${R}-${RST} resource "azurerm_resource_group" "main" {`,
          `      ${R}-${RST} id       = "/subscriptions/00000000.../resourceGroups/rg-myapp-dev-eus" ${GR}-> null${RST}`,
          `      ${R}-${RST} name     = "rg-myapp-dev-eus" ${GR}-> null${RST}`,
          `    }`,
          ``,
          `${BY}Plan:${RST} 0 to add, 0 to change, 1 to destroy.`,
          ``,
          `  ${C}Enter a value:${RST} yes`,
          ``,
          `azurerm_resource_group.main: Destroying...`,
          `azurerm_resource_group.main: Destruction complete after 3s`,
          ``,
          `${BG}Destroy complete! Resources: 1 destroyed.${RST}`,
        ].join('\n');
      },

      'terraform destroy -auto-approve': (state) => {
        state.applied = false;
        return [
          `azurerm_resource_group.main: Destroying...`,
          `azurerm_resource_group.main: Destruction complete after 3s`,
          `${BG}Destroy complete! Resources: 1 destroyed.${RST}`,
        ].join('\n');
      },
    },
  },

  2: {
    title: 'Azure Provider & Authentication',
    files: {
      'versions.tf': `terraform {
  required_version = ">= 1.5.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.85"
    }
  }
}`,
      'provider.tf': `provider "azurerm" {
  features {}
}`,
      'main.tf': `data "azurerm_subscription" "current" {}

output "sub_name" {
  value = data.azurerm_subscription.current.display_name
}`,
    },
    state: { applied: false },
    commands: {
      'terraform init': () => initOutput(['azurerm']),
      'terraform validate': () => validateOutput(),
      'terraform plan': (state) => {
        if (!state.initialized) return `${BR}Error:${RST} Run ${C}terraform init${RST} first.`;
        return [
          `${B}Terraform used the selected providers to generate the following execution plan.${RST}`,
          ``,
          `Changes to Outputs:`,
          `  ${G}+${RST} sub_name = "Visual Studio Enterprise Subscription"`,
          ``,
          `${BY}Plan:${RST} 0 to add, 0 to change, 0 to destroy.`,
          ``,
          `${GR}Note: data sources are read during plan, not tracked as managed resources.${RST}`,
        ].join('\n');
      },
      'terraform apply': (state) => {
        state.applied = true;
        return [
          `data.azurerm_subscription.current: Reading...`,
          `data.azurerm_subscription.current: Read complete after 1s`,
          `  ${GR}[id=/subscriptions/00000000-0000-0000-0000-000000000000]${RST}`,
          ``,
          `${BG}Apply complete! Resources: 0 added, 0 changed, 0 destroyed.${RST}`,
          ``,
          `Outputs:`,
          ``,
          `sub_name = "Visual Studio Enterprise Subscription"`,
        ].join('\n');
      },
      'terraform apply -auto-approve': (state) => {
        state.applied = true;
        return [
          `data.azurerm_subscription.current: Reading...`,
          `data.azurerm_subscription.current: Read complete after 1s`,
          ``,
          `${BG}Apply complete! Resources: 0 added, 0 changed, 0 destroyed.${RST}`,
          ``,
          `Outputs:`,
          `sub_name = "Visual Studio Enterprise Subscription"`,
        ].join('\n');
      },
      'terraform output': (state) => {
        if (!state.applied) return `${BR}Error:${RST} No state. Run apply first.`;
        return `sub_name = "Visual Studio Enterprise Subscription"`;
      },
      'az login': () => [
        `A web browser has been opened at https://login.microsoftonline.com/...`,
        `[${GR}Simulated${RST}] Authentication successful.`,
        ``,
        `Subscription  : Visual Studio Enterprise Subscription`,
        `Tenant        : contoso.onmicrosoft.com`,
        `User          : user@contoso.com`,
      ].join('\n'),
      'az account show': () => [
        `{`,
        `  "id": "00000000-0000-0000-0000-000000000000",`,
        `  "name": "Visual Studio Enterprise Subscription",`,
        `  "state": "Enabled",`,
        `  "tenantId": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"`,
        `}`,
      ].join('\n'),
      'az account show --query id -o tsv': () => `00000000-0000-0000-0000-000000000000`,
    },
  },

  3: {
    title: 'Variables, Outputs & Locals',
    files: {
      'variables.tf': `variable "project" {
  type        = string
  description = "Project name"
  default     = "learn"
  validation {
    condition     = length(var.project) <= 10 && can(regex("^[a-z0-9]+$", var.project))
    error_message = "Project must be lowercase alphanumeric, max 10 chars."
  }
}
variable "environment" {
  type    = string
  default = "dev"
  validation {
    condition     = contains(["dev","staging","prod"], var.environment)
    error_message = "Must be dev, staging, or prod."
  }
}
variable "location" {
  type    = string
  default = "East US"
}`,
      'locals.tf': `locals {
  prefix  = "\${var.project}-\${var.environment}"
  rg_name = "rg-\${local.prefix}"
  tags = {
    project     = var.project
    environment = var.environment
    managed_by  = "terraform"
  }
}`,
      'main.tf': `resource "azurerm_resource_group" "main" {
  name     = local.rg_name
  location = var.location
  tags     = local.tags
}`,
      'outputs.tf': `output "resource_group_name" {
  value = azurerm_resource_group.main.name
}`,
      'dev.tfvars': `project     = "learn"
environment = "dev"
location    = "East US"`,
      'prod.tfvars': `project     = "learn"
environment = "prod"
location    = "East US"`,
    },
    state: { applied: false, env: 'dev' },
    commands: {
      'terraform init': () => initOutput(['azurerm']),
      'terraform validate': () => validateOutput(),
      'terraform fmt': () => ``,
      'terraform plan': (state) => {
        if (!state.initialized) return `${BR}Error:${RST} Run init first.`;
        const env = state.env || 'dev';
        return [
          `  ${G}# azurerm_resource_group.main${RST} will be created`,
          `  ${G}+${RST} resource "azurerm_resource_group" "main" {`,
          `      ${G}+${RST} name     = "rg-learn-${env}"`,
          `      ${G}+${RST} location = "eastus"`,
          `      ${G}+${RST} tags     = { "environment" = "${env}", "managed_by" = "terraform", "project" = "learn" }`,
          `    }`,
          ``,
          `${BY}Plan:${RST} 1 to add, 0 to change, 0 to destroy.`,
        ].join('\n');
      },
      'terraform plan -var-file=dev.tfvars': (state) => {
        if (!state.initialized) return `${BR}Error:${RST} Run init first.`;
        state.env = 'dev';
        return [
          `  ${G}# azurerm_resource_group.main${RST} will be created`,
          `  ${G}+${RST} resource "azurerm_resource_group" "main" {`,
          `      ${G}+${RST} name     = "rg-learn-dev"`,
          `      ${G}+${RST} location = "eastus"`,
          `    }`,
          ``,
          `${BY}Plan:${RST} 1 to add, 0 to change, 0 to destroy.`,
        ].join('\n');
      },
      'terraform plan -var-file=prod.tfvars': (state) => {
        if (!state.initialized) return `${BR}Error:${RST} Run init first.`;
        state.env = 'prod';
        return [
          `  ${G}# azurerm_resource_group.main${RST} will be created`,
          `  ${G}+${RST} resource "azurerm_resource_group" "main" {`,
          `      ${G}+${RST} name     = "rg-learn-prod"`,
          `      ${G}+${RST} location = "eastus"`,
          `    }`,
          ``,
          `${BY}Plan:${RST} 1 to add, 0 to change, 0 to destroy.`,
        ].join('\n');
      },
      'terraform apply -var-file=dev.tfvars': (state) => {
        state.applied = true; state.env = 'dev';
        return [
          `azurerm_resource_group.main: Creating...`,
          `azurerm_resource_group.main: Creation complete after 2s`,
          ``,
          `${BG}Apply complete! Resources: 1 added, 0 changed, 0 destroyed.${RST}`,
          ``,
          `Outputs:`,
          `resource_group_name = "rg-learn-dev"`,
        ].join('\n');
      },
      'terraform apply -var-file=prod.tfvars': (state) => {
        state.applied = true; state.env = 'prod';
        return [
          `azurerm_resource_group.main: Creating...`,
          `azurerm_resource_group.main: Creation complete after 2s`,
          ``,
          `${BG}Apply complete! Resources: 1 added, 0 changed, 0 destroyed.${RST}`,
          ``,
          `Outputs:`,
          `resource_group_name = "rg-learn-prod"`,
        ].join('\n');
      },
      'terraform output': (state) => {
        if (!state.applied) return `${BR}Error:${RST} No state.`;
        return `resource_group_name = "rg-learn-${state.env || 'dev'}"`;
      },
      'terraform apply -var="environment=staging"': (state) => {
        state.applied = true; state.env = 'staging';
        return [
          `azurerm_resource_group.main: Creating...`,
          `azurerm_resource_group.main: Creation complete after 2s`,
          `${BG}Apply complete! Resources: 1 added, 0 changed, 0 destroyed.${RST}`,
          `Outputs:`,
          `resource_group_name = "rg-learn-staging"`,
        ].join('\n');
      },
      'terraform apply -var="environment=invalid"': () => {
        return [
          `${BR}Error: Invalid value for variable${RST}`,
          ``,
          `  on variables.tf line 8, in variable "environment":`,
          `   8:   validation {`,
          ``,
          `  Must be dev, staging, or prod.`,
          ``,
          `  This was checked by the validation rule at variables.tf:8,3-13.`,
        ].join('\n');
      },
    },
  },

  4: {
    title: 'State Management & Data Sources',
    files: {
      'main.tf': `data "azurerm_client_config"  "current" {}
data "azurerm_subscription"   "current" {}

resource "azurerm_resource_group" "main" {
  name     = "rg-learn-dev"
  location = "East US"
  lifecycle {
    prevent_destroy = true
  }
}

output "tenant_id"    { value = data.azurerm_client_config.current.tenant_id }
output "sub_name"     { value = data.azurerm_subscription.current.display_name }
output "rg_id"        { value = azurerm_resource_group.main.id }`,
    },
    state: { applied: false },
    commands: {
      'terraform init': () => initOutput(['azurerm']),
      'terraform validate': () => validateOutput(),
      'terraform plan': (state) => {
        if (!state.initialized) return `${BR}Error:${RST} Run init first.`;
        return [
          `  ${G}# azurerm_resource_group.main${RST} will be created`,
          `  ${G}+${RST} resource "azurerm_resource_group" "main" {`,
          `      ${G}+${RST} id       = (known after apply)`,
          `      ${G}+${RST} name     = "rg-learn-dev"`,
          `      ${G}+${RST} location = "eastus"`,
          `    }`,
          ``,
          `Changes to Outputs:`,
          `  ${G}+${RST} tenant_id = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"`,
          `  ${G}+${RST} sub_name  = "Visual Studio Enterprise Subscription"`,
          `  ${G}+${RST} rg_id     = (known after apply)`,
          ``,
          `${BY}Plan:${RST} 1 to add, 0 to change, 0 to destroy.`,
        ].join('\n');
      },
      'terraform apply -auto-approve': (state) => {
        state.applied = true;
        return [
          `data.azurerm_client_config.current: Reading...`,
          `data.azurerm_subscription.current: Reading...`,
          `data.azurerm_client_config.current: Read complete after 0s`,
          `data.azurerm_subscription.current: Read complete after 1s`,
          `azurerm_resource_group.main: Creating...`,
          `azurerm_resource_group.main: Creation complete after 2s`,
          `  ${GR}[id=/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg-learn-dev]${RST}`,
          ``,
          `${BG}Apply complete! Resources: 1 added, 0 changed, 0 destroyed.${RST}`,
          ``,
          `Outputs:`,
          `rg_id     = "/subscriptions/00000000.../resourceGroups/rg-learn-dev"`,
          `sub_name  = "Visual Studio Enterprise Subscription"`,
          `tenant_id = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"`,
        ].join('\n');
      },
      'terraform state list': (state) => {
        if (!state.applied) return `${GR}No resources in state.${RST}`;
        return [
          `data.azurerm_client_config.current`,
          `data.azurerm_subscription.current`,
          `azurerm_resource_group.main`,
        ].join('\n');
      },
      'terraform state show azurerm_resource_group.main': (state) => {
        if (!state.applied) return `${BR}Error:${RST} Not in state.`;
        return [
          `# azurerm_resource_group.main:`,
          `resource "azurerm_resource_group" "main" {`,
          `    id       = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg-learn-dev"`,
          `    location = "eastus"`,
          `    name     = "rg-learn-dev"`,
          `    tags     = {}`,
          `}`,
        ].join('\n');
      },
      'terraform destroy': (state) => {
        if (!state.applied) return `${GR}Nothing to destroy.${RST}`;
        return [
          `${BR}Error: Instance cannot be destroyed${RST}`,
          ``,
          `  on main.tf line 5, in resource "azurerm_resource_group" "main":`,
          `   5: resource "azurerm_resource_group" "main" {`,
          ``,
          `  Resource azurerm_resource_group.main has lifecycle.prevent_destroy set, but the`,
          `  plan calls for this resource to be destroyed. To avoid this error and continue`,
          `  with the destroy, either remove the prevent_destroy attribute or remove the`,
          `  dependency causing this resource to be destroyed.`,
        ].join('\n');
      },
      'terraform output': (state) => {
        if (!state.applied) return `${BR}Error:${RST} No state.`;
        return [
          `rg_id     = "/subscriptions/00000000.../resourceGroups/rg-learn-dev"`,
          `sub_name  = "Visual Studio Enterprise Subscription"`,
          `tenant_id = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"`,
        ].join('\n');
      },
    },
  },

  5: {
    title: 'PROJECT — Azure Baseline',
    files: {
      'locals.tf': `locals {
  prefix  = "\${var.project}-\${var.environment}"
  rg_name = "rg-\${local.prefix}-\${var.location_short}"
  st_name = substr(replace("st\${var.project}\${var.environment}", "-", ""), 0, 24)
  kv_name = "kv-\${local.prefix}-001"
  tags    = { project = var.project, environment = var.environment, managed_by = "terraform" }
}`,
      'main.tf': `data "azurerm_client_config" "current" {}

resource "azurerm_resource_group" "main" {
  name = local.rg_name; location = var.location; tags = local.tags
}
resource "azurerm_storage_account" "main" {
  name                     = local.st_name
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = var.environment == "prod" ? "GRS" : "LRS"
  min_tls_version          = "TLS1_2"
  tags                     = local.tags
}
resource "azurerm_key_vault" "main" {
  name                       = local.kv_name
  location                   = azurerm_resource_group.main.location
  resource_group_name        = azurerm_resource_group.main.name
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  sku_name                   = "standard"
  purge_protection_enabled   = var.environment == "prod"
  soft_delete_retention_days = 7
  tags                       = local.tags
}`,
    },
    state: { applied: false },
    commands: {
      'terraform init': () => initOutput(['azurerm', 'random']),
      'terraform validate': () => validateOutput(),
      'terraform plan': (state) => {
        if (!state.initialized) return `${BR}Error:${RST} Run init first.`;
        return [
          `  ${G}# azurerm_resource_group.main${RST} will be created`,
          `  ${G}+${RST} resource "azurerm_resource_group" "main" { name = "rg-learn-dev-eus" }`,
          ``,
          `  ${G}# azurerm_storage_account.main${RST} will be created`,
          `  ${G}+${RST} resource "azurerm_storage_account" "main" {`,
          `      ${G}+${RST} name                     = "stlearndev"`,
          `      ${G}+${RST} account_replication_type = "LRS"`,
          `      ${G}+${RST} min_tls_version          = "TLS1_2"`,
          `    }`,
          ``,
          `  ${G}# azurerm_key_vault.main${RST} will be created`,
          `  ${G}+${RST} resource "azurerm_key_vault" "main" {`,
          `      ${G}+${RST} name                     = "kv-learn-dev-001"`,
          `      ${G}+${RST} purge_protection_enabled = false`,
          `    }`,
          ``,
          `${BY}Plan:${RST} 3 to add, 0 to change, 0 to destroy.`,
        ].join('\n');
      },
      'terraform plan -var-file=prod.tfvars': (state) => {
        if (!state.initialized) return `${BR}Error:${RST} Run init first.`;
        return [
          `  ${G}# azurerm_storage_account.main${RST} will be created`,
          `  ${G}+${RST} resource "azurerm_storage_account" "main" {`,
          `      ${G}+${RST} account_replication_type = "GRS"`,
          `    }`,
          `  ${G}# azurerm_key_vault.main${RST} will be created`,
          `  ${G}+${RST} resource "azurerm_key_vault" "main" {`,
          `      ${G}+${RST} purge_protection_enabled = ${G}true${RST}`,
          `    }`,
          ``,
          `${BY}Plan:${RST} 3 to add, 0 to change, 0 to destroy.`,
          ``,
          `${GR}# Note: prod uses GRS storage and purge_protection = true${RST}`,
        ].join('\n');
      },
      'terraform apply -auto-approve': (state) => {
        state.applied = true;
        return [
          `azurerm_resource_group.main: Creating...`,
          `azurerm_resource_group.main: Creation complete after 2s`,
          `azurerm_storage_account.main: Creating...`,
          `azurerm_storage_account.main: Still creating... [10s elapsed]`,
          `azurerm_storage_account.main: Creation complete after 18s`,
          `azurerm_key_vault.main: Creating...`,
          `azurerm_key_vault.main: Creation complete after 12s`,
          ``,
          `${BG}Apply complete! Resources: 3 added, 0 changed, 0 destroyed.${RST}`,
          ``,
          `Outputs:`,
          `key_vault_uri          = "https://kv-learn-dev-001.vault.azure.net/"`,
          `resource_group_name    = "rg-learn-dev-eus"`,
          `storage_account_name   = "stlearndev"`,
        ].join('\n');
      },
      'terraform output': (state) => {
        if (!state.applied) return `${BR}Error:${RST} No state.`;
        return [
          `key_vault_uri          = "https://kv-learn-dev-001.vault.azure.net/"`,
          `resource_group_name    = "rg-learn-dev-eus"`,
          `storage_account_name   = "stlearndev"`,
          `storage_connection_string = <sensitive>`,
        ].join('\n');
      },
      'terraform output -json storage_connection_string': (state) => {
        if (!state.applied) return `${BR}Error:${RST} No state.`;
        return `"DefaultEndpointsProtocol=https;AccountName=stlearndev;AccountKey=REDACTED;EndpointSuffix=core.windows.net"`;
      },
      'terraform destroy -auto-approve': (state) => {
        state.applied = false;
        return [
          `azurerm_key_vault.main: Destroying...`,
          `azurerm_key_vault.main: Destruction complete after 5s`,
          `azurerm_storage_account.main: Destroying...`,
          `azurerm_storage_account.main: Destruction complete after 8s`,
          `azurerm_resource_group.main: Destroying...`,
          `azurerm_resource_group.main: Destruction complete after 45s`,
          ``,
          `${BG}Destroy complete! Resources: 3 destroyed.${RST}`,
        ].join('\n');
      },
    },
  },
};

// ─── Generate generic responses for days 6-30 ────────────────────────────────
const genericDayConfig = (dayId, title, resources, extraOutputs = []) => ({
  title,
  files: {
    'main.tf': `# Day ${dayId} — ${title}\n# Edit this file and run terraform commands below`,
    'variables.tf': `variable "environment" { type = string; default = "dev" }\nvariable "location"    { type = string; default = "East US" }`,
  },
  state: { applied: false },
  commands: {
    'terraform init': () => initOutput(['azurerm']),
    'terraform validate': () => validateOutput(),
    'terraform fmt': () => ``,
    'terraform fmt -check': () => ``,
    'terraform plan': (state) => {
      if (!state.initialized) return `${BR}Error:${RST} Run ${C}terraform init${RST} first.`;
      const lines = [
        `${B}Terraform will perform the following actions:${RST}`,
        ``,
      ];
      resources.forEach(r => {
        lines.push(`  ${G}# ${r}${RST} will be created`);
        lines.push(`  ${G}+${RST} resource "${r.split('.')[0]}" "${r.split('.')[1]}" {`);
        lines.push(`      ${G}+${RST} id = (known after apply)`);
        lines.push(`    }`);
        lines.push(``);
      });
      lines.push(`${BY}Plan:${RST} ${resources.length} to add, 0 to change, 0 to destroy.`);
      return lines.join('\n');
    },
    'terraform apply': (state) => {
      if (!state.initialized) return `${BR}Error:${RST} Run init first.`;
      if (state.applied) return `${BG}Apply complete! Resources: 0 added, 0 changed, 0 destroyed.${RST}\n\nNo changes. Infrastructure is up-to-date.`;
      state.applied = true;
      const lines = [];
      resources.forEach((r, i) => {
        lines.push(`${r}: Creating...`);
        lines.push(`${r}: Creation complete after ${(i + 1) * 3}s`);
      });
      lines.push(``);
      lines.push(`${BG}Apply complete! Resources: ${resources.length} added, 0 changed, 0 destroyed.${RST}`);
      if (extraOutputs.length > 0) {
        lines.push(`\nOutputs:`);
        extraOutputs.forEach(o => lines.push(o));
      }
      return lines.join('\n');
    },
    'terraform apply -auto-approve': (state) => {
      state.applied = true;
      const lines = [];
      resources.forEach((r, i) => {
        lines.push(`${r}: Creating...`);
        lines.push(`${r}: Creation complete after ${(i + 1) * 3}s`);
      });
      lines.push(`\n${BG}Apply complete! Resources: ${resources.length} added, 0 changed, 0 destroyed.${RST}`);
      if (extraOutputs.length > 0) {
        lines.push(`\nOutputs:`);
        extraOutputs.forEach(o => lines.push(o));
      }
      return lines.join('\n');
    },
    'terraform state list': (state) => {
      if (!state.applied) return `${GR}No resources in state. Run terraform apply first.${RST}`;
      return resources.join('\n');
    },
    'terraform output': (state) => {
      if (!state.applied) return `${BR}Error:${RST} No state.`;
      if (extraOutputs.length === 0) return `${GR}No outputs defined.${RST}`;
      return extraOutputs.join('\n');
    },
    'terraform destroy': (state) => {
      if (!state.applied) return `${GR}Nothing to destroy.${RST}`;
      state.applied = false;
      const lines = [];
      [...resources].reverse().forEach((r, i) => {
        lines.push(`${r}: Destroying...`);
        lines.push(`${r}: Destruction complete after ${(i + 1) * 4}s`);
      });
      lines.push(`\n${BG}Destroy complete! Resources: ${resources.length} destroyed.${RST}`);
      return lines.join('\n');
    },
    'terraform destroy -auto-approve': (state) => {
      state.applied = false;
      const lines = [];
      [...resources].reverse().forEach((r, i) => {
        lines.push(`${r}: Destroying...`);
        lines.push(`${r}: Destruction complete after ${(i + 1) * 4}s`);
      });
      lines.push(`\n${BG}Destroy complete! Resources: ${resources.length} destroyed.${RST}`);
      return lines.join('\n');
    },
  },
});

// Fill days 6-30 with appropriate resources
const dayConfigs = {
  6: genericDayConfig(6, 'Azure VNet & Subnets',
    ['azurerm_resource_group.main','azurerm_virtual_network.main','azurerm_subnet.subnets["app"]','azurerm_subnet.subnets["data"]','azurerm_subnet.subnets["mgmt"]','azurerm_subnet.subnets["AzureBastionSubnet"]'],
    ['subnet_ids = { app = "/subscriptions/.../subnets/app", data = "...", mgmt = "...", AzureBastionSubnet = "..." }','vnet_id = "/subscriptions/.../virtualNetworks/vnet-learn-dev"']
  ),
  7: genericDayConfig(7, 'NSGs & Security Rules',
    ['azurerm_network_security_group.nsg["app"]','azurerm_network_security_group.nsg["data"]','azurerm_network_security_group.nsg["mgmt"]','azurerm_network_security_rule.app["Allow-HTTP"]','azurerm_network_security_rule.app["Allow-HTTPS"]','azurerm_network_security_rule.app["Deny-RDP-Internet"]','azurerm_subnet_network_security_group_association.nsg["app"]','azurerm_subnet_network_security_group_association.nsg["data"]','azurerm_subnet_network_security_group_association.nsg["mgmt"]'],
    []
  ),
  8: genericDayConfig(8, 'Virtual Machines',
    ['azurerm_public_ip.vm','azurerm_network_interface.vm','azurerm_linux_virtual_machine.main'],
    ['vm_public_ip  = "20.123.45.67"','vm_private_ip = "10.0.1.4"','vm_id = "/subscriptions/.../virtualMachines/vm-learn-dev"']
  ),
  9: genericDayConfig(9, 'Azure Load Balancer',
    ['azurerm_public_ip.lb','azurerm_lb.main','azurerm_lb_backend_address_pool.main','azurerm_lb_probe.http','azurerm_lb_rule.http','azurerm_network_interface_backend_address_pool_association.vm["vm1"]','azurerm_network_interface_backend_address_pool_association.vm["vm2"]'],
    ['lb_public_ip = "20.99.88.77"','lb_id = "/subscriptions/.../loadBalancers/lb-learn-dev"']
  ),
  10: genericDayConfig(10, 'Hub-Spoke Network',
    ['azurerm_virtual_network.hub','azurerm_virtual_network.spoke','azurerm_subnet.hub_bastion','azurerm_subnet.spoke_app','azurerm_virtual_network_peering.hub_to_spoke','azurerm_virtual_network_peering.spoke_to_hub','azurerm_public_ip.bastion','azurerm_bastion_host.main'],
    ['hub_vnet_id   = "/subscriptions/.../virtualNetworks/vnet-hub-learn-dev"','spoke_vnet_id = "/subscriptions/.../virtualNetworks/vnet-spoke-learn-dev"','peering_hub_to_spoke_state = "Connected"','peering_spoke_to_hub_state = "Connected"']
  ),
  11: genericDayConfig(11, 'VM Scale Sets',
    ['azurerm_linux_virtual_machine_scale_set.app','azurerm_monitor_autoscale_setting.app'],
    ['vmss_id = "/subscriptions/.../virtualMachineScaleSets/vmss-app-learn-dev"','vmss_principal_id = "bbbbbbbb-cccc-dddd-eeee-ffffffffffff"']
  ),
  12: genericDayConfig(12, 'Availability Zones',
    ['azurerm_public_ip.zone_redundant','azurerm_linux_virtual_machine.vm_zone1','azurerm_linux_virtual_machine.vm_zone2'],
    ['vm_zone1_ip = "10.0.1.4"','vm_zone2_ip = "10.0.1.5"','public_ip_zones = ["1","2","3"]']
  ),
  13: genericDayConfig(13, 'Storage Accounts',
    ['azurerm_storage_account.main','azurerm_storage_container.app_data','azurerm_storage_container.backups','azurerm_storage_management_policy.main'],
    ['storage_account_name   = "stlearndev6ab3f2"','primary_blob_endpoint = "https://stlearndev6ab3f2.blob.core.windows.net/"']
  ),
  14: genericDayConfig(14, 'Key Vault & Secrets',
    ['azurerm_key_vault.main','azurerm_role_assignment.kv_tf_secrets_officer','random_password.db','azurerm_key_vault_secret.db_password'],
    ['key_vault_uri    = "https://kv-learn-dev-001.vault.azure.net/"','secret_version   = "abc123def456"']
  ),
  15: genericDayConfig(15, 'Azure SQL Database',
    ['azurerm_mssql_server.main','azurerm_mssql_firewall_rule.admin_ip','azurerm_mssql_database.app'],
    ['sql_server_fqdn  = "sql-learn-dev-001.database.windows.net"','sql_database_name = "db-app"']
  ),
  16: genericDayConfig(16, 'Cosmos DB',
    ['azurerm_cosmosdb_account.main','azurerm_cosmosdb_sql_database.app','azurerm_cosmosdb_sql_container.items'],
    ['cosmos_endpoint = "https://cosmos-learn-dev-001.documents.azure.com:443/"']
  ),
  17: genericDayConfig(17, '3-Tier App Infrastructure',
    ['azurerm_resource_group.main','azurerm_virtual_network.main','azurerm_subnet.subnets["app"]','azurerm_subnet.subnets["data"]','azurerm_network_security_group.nsg["app"]','azurerm_key_vault.main','azurerm_key_vault_secret.sql_password','azurerm_storage_account.main','azurerm_mssql_server.main','azurerm_mssql_database.app','azurerm_lb.main','azurerm_linux_virtual_machine_scale_set.app','azurerm_log_analytics_workspace.main'],
    ['lb_public_ip      = "20.55.44.33"','sql_server_fqdn   = "sql-learn-dev-001.database.windows.net"','key_vault_uri     = "https://kv-learn-dev-001.vault.azure.net/"','log_analytics_workspace_id = "/subscriptions/.../workspaces/law-learn-dev"']
  ),
  18: genericDayConfig(18, 'Terraform Modules',
    ['module.networking.azurerm_virtual_network.this','module.networking.azurerm_subnet.this["app"]','module.networking.azurerm_subnet.this["data"]','module.networking.azurerm_subnet.this["mgmt"]'],
    ['subnet_ids = module.networking.subnet_ids','vnet_id    = module.networking.vnet_id']
  ),
  19: genericDayConfig(19, 'Remote State — Azure Blob',
    ['azurerm_resource_group.main','azurerm_virtual_network.main'],
    ['resource_group_name = "rg-learn-dev-eus"']
  ),
  20: genericDayConfig(20, 'Terraform Workspaces',
    ['azurerm_resource_group.main','azurerm_linux_virtual_machine_scale_set.app'],
    ['current_environment = "Deployed to: dev"']
  ),
  21: genericDayConfig(21, 'HCP Terraform Cloud',
    ['azurerm_resource_group.main'],
    ['resource_group_name = "rg-learn-dev-eus"']
  ),
  22: genericDayConfig(22, 'Multi-env Module Library',
    ['module.networking.azurerm_virtual_network.this','module.keyvault.azurerm_key_vault.this','module.database.azurerm_mssql_server.main','module.compute.azurerm_linux_virtual_machine_scale_set.app'],
    ['environment = "dev"','vnet_id = "/subscriptions/.../virtualNetworks/vnet-learn-dev"']
  ),
  23: genericDayConfig(23, 'AKS',
    ['azurerm_kubernetes_cluster.main','azurerm_kubernetes_cluster_node_pool.workload','azurerm_role_assignment.aks_network'],
    ['aks_cluster_name = "aks-learn-dev"','aks_fqdn = "aks-learn-dev-abc123.hcp.eastus.azmk8s.io"']
  ),
  24: genericDayConfig(24, 'App Service & Functions',
    ['azurerm_service_plan.main','azurerm_linux_web_app.main','azurerm_linux_web_app_slot.staging','azurerm_linux_function_app.main','azurerm_role_assignment.app_kv'],
    ['app_url      = "https://app-learn-dev.azurewebsites.net"','function_url = "https://func-learn-dev.azurewebsites.net"']
  ),
  25: genericDayConfig(25, 'Entra ID & RBAC',
    ['azuread_application.cicd','azuread_service_principal.cicd','azuread_service_principal_password.cicd','azurerm_key_vault_secret.cicd_secret','azurerm_role_assignment.cicd_contributor','azurerm_role_definition.kv_reader','azuread_group.app_readers','azurerm_role_assignment.kv_readers'],
    ['cicd_client_id = "cccccccc-dddd-eeee-ffff-000000000000"','cicd_tenant_id = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"']
  ),
  26: genericDayConfig(26, 'Microsoft Sentinel',
    ['azurerm_log_analytics_workspace.sentinel','azurerm_sentinel_log_analytics_workspace_onboarding.main','azurerm_sentinel_data_connector_azure_active_directory.aad','azurerm_sentinel_alert_rule_scheduled.impossible_travel','azurerm_sentinel_automation_rule.close_informational'],
    ['sentinel_workspace_id = "/subscriptions/.../workspaces/law-sentinel-learn-dev"']
  ),
  27: genericDayConfig(27, 'AKS + Sentinel Platform',
    ['azurerm_monitor_diagnostic_setting.aks','azurerm_sentinel_alert_rule_scheduled.privileged_container','azurerm_sentinel_alert_rule_scheduled.kubectl_exec','azurerm_sentinel_automation_rule.high_severity'],
    ['sentinel_workspace_id = "/subscriptions/.../workspaces/law-sentinel-learn-dev"','aks_cluster_name = "aks-learn-dev"']
  ),
  28: genericDayConfig(28, 'CI/CD — Azure DevOps',
    ['azurerm_resource_group.main'],
    ['resource_group_name = "rg-learn-dev-eus"']
  ),
  29: genericDayConfig(29, 'Terragrunt',
    ['azurerm_resource_group.main','azurerm_virtual_network.main'],
    ['resource_group_name = "rg-learn-dev-eus"']
  ),
  30: genericDayConfig(30, 'CAPSTONE — Azure Landing Zone',
    ['azurerm_management_group.platform','azurerm_management_group.landingzones','azurerm_management_group.corp','azurerm_policy_definition.require_tags','azurerm_management_group_policy_assignment.require_tags','azurerm_management_group_policy_assignment.no_public_blob','azurerm_virtual_network.hub','azurerm_virtual_network.spoke','azurerm_bastion_host.main','azurerm_kubernetes_cluster.main','azurerm_linux_web_app.main','azurerm_mssql_server.main','azurerm_sentinel_log_analytics_workspace_onboarding.main'],
    ['platform_mg_id      = "/providers/Microsoft.Management/managementGroups/platform"','landingzones_mg_id  = "/providers/Microsoft.Management/managementGroups/landingzones"','hub_vnet_id         = "/subscriptions/.../virtualNetworks/vnet-hub-learn-dev"','aks_cluster_name    = "aks-learn-dev"']
  ),
};

// Merge detailed + generic configs
const allDays = { ...terminalDays, ...dayConfigs };

// ─── Command processor ────────────────────────────────────────────────────────
function processCommand(dayId, command, sessionState) {
  const cfg = allDays[dayId];
  if (!cfg) return { output: `${BR}Error:${RST} No terminal config for Day ${dayId}.`, state: sessionState };

  const state = sessionState || { initialized: false, applied: false };
  const cmd = command.trim();

  // Global commands
  if (cmd === 'clear' || cmd === 'cls') return { output: '\x1b[2J\x1b[H', state, clear: true };
  if (cmd === 'ls' || cmd === 'ls -la') {
    const files = Object.keys(cfg.files || {}).join('\n');
    return { output: files || '(empty directory)', state };
  }
  if (cmd.startsWith('cat ')) {
    const fname = cmd.slice(4).trim();
    const content = cfg.files?.[fname];
    if (!content) return { output: `${BR}cat: ${fname}: No such file${RST}`, state };
    return { output: content, state };
  }
  if (cmd === 'pwd') return { output: `/home/user/terraform-day${dayId}`, state };
  if (cmd === 'help' || cmd === 'terraform help' || cmd === 'terraform --help') {
    return { output: [
      `${B}Available commands for Day ${dayId}:${RST}`,
      ``,
      `  ${C}terraform init${RST}              Initialize the working directory`,
      `  ${C}terraform validate${RST}          Check configuration syntax`,
      `  ${C}terraform fmt${RST}               Format HCL files`,
      `  ${C}terraform plan${RST}              Preview changes`,
      `  ${C}terraform apply${RST}             Apply changes`,
      `  ${C}terraform apply -auto-approve${RST} Apply without prompting`,
      `  ${C}terraform output${RST}            Show output values`,
      `  ${C}terraform state list${RST}        List tracked resources`,
      `  ${C}terraform state show <addr>${RST} Show resource details`,
      `  ${C}terraform destroy${RST}           Destroy infrastructure`,
      `  ${C}ls${RST}                          List files in workspace`,
      `  ${C}cat <filename>${RST}              View a file`,
      `  ${C}clear${RST}                       Clear terminal`,
    ].join('\n'), state };
  }

  // terraform init — mark as initialized
  if (cmd === 'terraform init' || cmd === 'terraform init -migrate-state') {
    state.initialized = true;
    const fn = cfg.commands?.['terraform init'];
    return { output: fn ? fn(state) : initOutput(['azurerm']), state };
  }

  // Look up in day config
  const fn = cfg.commands?.[cmd];
  if (fn) {
    const output = fn(state);
    return { output, state };
  }

  // Partial match for commands with arguments we don't have
  const baseCmd = Object.keys(cfg.commands || {}).find(k => cmd.startsWith(k.split(' ')[0] + ' '));
  if (baseCmd) {
    const fn2 = cfg.commands[baseCmd];
    return { output: fn2 ? fn2(state) : `${GR}Command variant not simulated. Try: ${baseCmd}${RST}`, state };
  }

  // Unknown command
  if (cmd.startsWith('terraform ')) {
    return { output: `${BR}Error:${RST} Unknown terraform command: "${cmd}"\nRun ${C}help${RST} to see available commands.`, state };
  }
  if (cmd === '') return { output: '', state };
  return { output: `${BR}bash: ${cmd}: command not found${RST}\nType ${C}help${RST} to see available Terraform commands.`, state };
}

module.exports = { processCommand, allDays };
