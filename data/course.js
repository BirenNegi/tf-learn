const phases = [
  {
    id: 1,
    name: "Foundation",
    color: "#1D9E75",
    bg: "#E1F5EE",
    textColor: "#085041",
    days: [1, 2, 3, 4, 5],
  },
  {
    id: 2,
    name: "Networking & Compute",
    color: "#378ADD",
    bg: "#E6F1FB",
    textColor: "#0C447C",
    days: [6, 7, 8, 9, 10, 11, 12],
  },
  {
    id: 3,
    name: "Storage & Databases",
    color: "#D85A30",
    bg: "#FAECE7",
    textColor: "#712B13",
    days: [13, 14, 15, 16, 17],
  },
  {
    id: 4,
    name: "Modules & State",
    color: "#7F77DD",
    bg: "#EEEDFE",
    textColor: "#3C3489",
    days: [18, 19, 20, 21, 22],
  },
  {
    id: 5,
    name: "Advanced Azure",
    color: "#BA7517",
    bg: "#FAEEDA",
    textColor: "#633806",
    days: [23, 24, 25, 26, 27],
  },
  {
    id: 6,
    name: "CI/CD & Capstone",
    color: "#D4537E",
    bg: "#FBEAF0",
    textColor: "#72243E",
    days: [28, 29, 30],
  },
];

const days = [
  {
    id: 1,
    phase: 1,
    type: "theory",
    title: "Terraform & IaC Fundamentals",
    subtitle: "What IaC is, how Terraform works, HCL syntax basics",
    theory: {
      intro: `Infrastructure as Code (IaC) means defining your servers, networks, databases — all your cloud resources — using code files instead of clicking through a portal. This gives you version control, repeatability, and automation. Without IaC, every deployment is a manual, undocumented process. With IaC, your infrastructure is a Git repository.`,
      concepts: [
        {
          title: "What is Terraform?",
          body: `Terraform is an open-source IaC tool by HashiCorp. You write configuration files in HCL (HashiCorp Configuration Language), and Terraform figures out what to create, change, or delete in your cloud provider. It compares your desired state (code) against current state (state file) and makes only the necessary changes — this is called idempotency.`,
        },
        {
          title: "Terraform vs ARM vs Bicep",
          body: `ARM templates are JSON-heavy and Azure-only. A simple VM is 200+ lines of raw JSON. Bicep is Microsoft's cleaner replacement — great syntax, Azure-only. Terraform works across Azure, AWS, GCP, and even SaaS tools like GitHub and Datadog. For consultants working with multiple clients across clouds, Terraform is the industry standard — one tool, one workflow.`,
        },
        {
          title: "Terraform Core Architecture",
          body: `Three components: (1) Core — the terraform CLI binary, reads HCL, computes diffs, executes changes. (2) Providers — plugins that talk to cloud APIs. azurerm talks to Azure Resource Manager. Downloaded via terraform init. (3) State — terraform.tfstate file that maps your config to real Azure resource IDs. The memory of Terraform.`,
        },
        {
          title: "The Terraform Workflow",
          body: `Write HCL → terraform init (downloads provider) → terraform plan (preview changes) → terraform apply (create resources in Azure) → terraform destroy (clean up). This loop is what you run every day. The plan step is the most important — always read it before applying. It shows + (create), ~ (update), - (destroy) for every resource.`,
        },
        {
          title: "HCL Block Types",
          body: `terraform{} — meta-config, declares required providers and versions. provider{} — configures the cloud provider (Azure credentials, features). resource{} — creates something in Azure. data{} — reads an existing resource without creating. variable{} — input parameters. locals{} — computed internal values. output{} — exports values after apply.`,
        },
        {
          title: "Azure Resource Group — The Container",
          body: `Unlike AWS where most resources are region-level, Azure requires every resource to live inside a Resource Group. VMs, VNets, Storage Accounts, Key Vaults — everything has resource_group_name. The RG is the unit of billing, access control (RBAC), and lifecycle management. In Terraform, create the RG first, then reference it in every other resource.`,
        },
      ],
      code: `# versions.tf — always pin your provider version
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.85"   # ~> allows 3.85.x but NOT 4.x
    }
  }
}

# provider.tf — configure Azure connection
provider "azurerm" {
  features {}   # required block, can be empty for now
}

# main.tf — your first Azure resource
resource "azurerm_resource_group" "main" {
  name     = "rg-myapp-dev-eus"
  location = "East US"

  tags = {
    environment = "dev"
    managed_by  = "terraform"
  }
}

# outputs.tf — expose values after apply
output "rg_name" {
  description = "The resource group name"
  value       = azurerm_resource_group.main.name
}

output "rg_id" {
  description = "The full Azure resource ID"
  value       = azurerm_resource_group.main.id
}`,
      codeExplainer: `Line by line: required_version pins Terraform CLI itself. ~> 3.85 allows 3.85.x patches but blocks major version jumps. features{} is mandatory for azurerm — leave it empty for now. In the resource block: "azurerm_resource_group" is the TYPE, "main" is YOUR local label. Together they form the address azurerm_resource_group.main — used when referencing this resource elsewhere. The output block reads azurerm_resource_group.main.name — Terraform fetches this from state after creation.`,
      warnings: [
        "Never run terraform apply without reading the full plan first.",
        "Storage account names: lowercase alphanumeric only, 3–24 chars. No hyphens.",
        "Always run terraform destroy after labs — Azure bills by the second.",
        "Never manually edit terraform.tfstate — corruption loses track of all resources.",
      ],
    },
    lab: {
      intro:
        "Set up your Terraform environment from scratch. You will install the tools, write your first HCL file, and run the complete workflow against real Azure.",
      steps: [
        {
          title: "Install Terraform CLI",
          desc: `Windows: download zip from developer.hashicorp.com/terraform/downloads, extract terraform.exe to C:\\tools\\terraform, add to PATH.\n\nLinux/Mac:\nbrew install terraform\n\nVerify:\nterraform -version\n\nYou should see: Terraform v1.x.x`,
        },
        {
          title: "Install Azure CLI",
          desc: `docs.microsoft.com/en-us/cli/azure/install-azure-cli\n\nAfter install:\naz login\n\nA browser window opens — sign in with your Azure account.\n\nVerify:\naz account show\n\nYou should see your subscription name and ID.`,
        },
        {
          title: "Create your project folder",
          desc: `mkdir terraform-day1\ncd terraform-day1\n\nCreate three files:\n- versions.tf\n- provider.tf\n- main.tf\n\nPaste the code from the Theory section into the correct files. Terraform reads ALL .tf files in the directory — filename order doesn't matter.`,
        },
        {
          title: "terraform init",
          desc: `Run:\nterraform init\n\nTerraform downloads the azurerm provider into .terraform/ folder.\nCreates .terraform.lock.hcl (locks exact provider version).\n\nExpected output:\n"Terraform has been successfully initialized!"\n\nIf you see errors: check internet connection and that you're in the correct folder.`,
        },
        {
          title: "terraform plan — read the output",
          desc: `Run:\nterraform plan\n\nTerraform connects to Azure and shows:\n+ azurerm_resource_group.main will be created\n  + id       = (known after apply)\n  + location = "eastus"\n  + name      = "rg-myapp-dev-eus"\n\nThe + sign means CREATE. Nothing has been created in Azure yet — this is just a preview. Read every line.`,
        },
        {
          title: "terraform apply",
          desc: `Run:\nterraform apply\n\nTerraform shows the plan again and asks:\n"Do you want to perform these actions? Enter a value: "\n\nType: yes\n\nAfter ~10 seconds:\n"Apply complete! Resources: 1 added, 0 changed, 0 destroyed."\n\nYour resource group now exists in Azure.`,
        },
        {
          title: "Verify in Azure portal",
          desc: `Open portal.azure.com → Resource Groups.\n\nYou should see: rg-myapp-dev-eus\nClick it → check the Tags tab: environment=dev, managed_by=terraform\n\nThis confirms Terraform created exactly what you defined.`,
        },
        {
          title: "terraform destroy — clean up",
          desc: `Run:\nterraform destroy\n\nType: yes\n\nTerraform deletes the resource group and everything inside it.\n\n"Destroy complete! Resources: 1 destroyed."\n\nAlways do this after each lab to avoid unexpected Azure charges.`,
        },
      ],
    },
    challenge: {
      task: `Write a Terraform config that creates 3 resource groups — dev, staging, and prod — using a SINGLE resource block with for_each. Each RG name should follow the pattern: rg-learn-{environment}. Each RG should have a tag with its environment name. You are NOT allowed to copy-paste the resource block 3 times.`,
      hints: [
        `Declare a variable of type set(string) containing ["dev","staging","prod"]`,
        `Use for_each = var.environments on the resource block`,
        `Inside the block, reference the current value with each.key`,
        `Name becomes: "rg-learn-\${each.key}"`,
      ],
      solution: `variable "environments" {
  type    = set(string)
  default = ["dev", "staging", "prod"]
}

resource "azurerm_resource_group" "env" {
  for_each = var.environments
  name     = "rg-learn-\${each.key}"
  location = "East US"

  tags = {
    environment = each.key
    managed_by  = "terraform"
  }
}

output "rg_names" {
  value = { for k, v in azurerm_resource_group.env : k => v.name }
}`,
    },
    deepDiveTopics: [
      "How does terraform plan work internally — step by step",
      "Terraform state file deep dive — what's inside terraform.tfstate",
      "~> version constraint vs >= vs = — which to use and why",
      "HCL vs JSON — why HCL was invented for IaC",
      "Terraform dependency graph — how Terraform orders resource creation",
      "for_each vs count — when to use which",
    ],
  },
  {
    id: 2,
    phase: 1,
    type: "theory",
    title: "Azure Provider & Authentication",
    subtitle: "Service principals, env vars, auth methods, terraform init deep dive",
    theory: {
      intro: `Before Terraform can create anything in Azure, it must authenticate to the Azure Resource Manager API. There are four ways to do this — choosing the right one matters for security and CI/CD pipelines. For local development, Azure CLI auth is simplest. For pipelines, Service Principal is the standard.`,
      concepts: [
        {
          title: "Authentication Methods",
          body: `Four options: (1) Azure CLI — uses your az login session. Simplest for local dev. (2) Service Principal + Client Secret — an app identity with a password. Standard for CI/CD. (3) Service Principal + Certificate — more secure than secret, certificate-based. (4) Managed Identity — for VMs or Azure DevOps agents running inside Azure, no credentials needed. The azurerm provider auto-detects which method to use based on environment variables.`,
        },
        {
          title: "What is a Service Principal?",
          body: `A Service Principal is like a service account in Azure Entra ID (formerly Azure AD). It's an application identity — not a human. Terraform uses it to authenticate as an app. It needs a Role Assignment to do anything: typically Contributor on the subscription or resource group. Create it once with az ad sp create-for-rbac and save the output — the secret is shown only once.`,
        },
        {
          title: "Environment Variables — Never Hardcode",
          body: `The azurerm provider reads four environment variables: ARM_CLIENT_ID (the service principal app ID), ARM_CLIENT_SECRET (the password), ARM_TENANT_ID (your Azure AD tenant), ARM_SUBSCRIPTION_ID (which subscription to target). Set these in your shell and your provider.tf stays credential-free. Never commit secrets to .tf files or .tfvars in git.`,
        },
        {
          title: "terraform init in depth",
          body: `init does three things: (1) Downloads provider plugins into .terraform/ directory. (2) Creates .terraform.lock.hcl — locks exact provider version checksums so all team members use identical providers. (3) Initialises the backend — where state is stored (local by default, Azure Blob for production). Run init again when you add a new provider or change backend config.`,
        },
        {
          title: "The features{} Block",
          body: `features{} is required but controls optional provider behaviours. key_vault { purge_soft_delete_on_destroy = true } — deletes KVs immediately in dev instead of waiting 90 days. virtual_machine { delete_os_disk_on_deletion = true } — removes the disk when you delete a VM. For beginners, leave it empty. In Day 14 (Key Vault) you'll need the KV setting.`,
        },
        {
          title: "Multi-file Config — Best Practice",
          body: `Split your config: versions.tf (terraform block), provider.tf (provider block), main.tf (resources), variables.tf (variable blocks), outputs.tf (output blocks), locals.tf (local blocks). Terraform reads ALL .tf files in the directory — order and filename don't matter. This separation makes large configs navigable and avoids merge conflicts in team environments.`,
        },
      ],
      code: `# versions.tf
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.85"
    }
  }
}

# provider.tf — NO credentials here, ever
# ARM_* environment variables are read automatically
provider "azurerm" {
  features {
    key_vault {
      purge_soft_delete_on_destroy    = true
      recover_soft_deleted_key_vaults = true
    }
    virtual_machine {
      delete_os_disk_on_deletion = true
    }
  }
  # subscription_id = var.subscription_id  # optional override
}

# ── How to create a Service Principal (run in terminal, not in TF) ──
# az ad sp create-for-rbac \\
#   --name "sp-terraform-learn" \\
#   --role Contributor \\
#   --scopes /subscriptions/<SUBSCRIPTION_ID>
#
# Output: { "appId": "...", "password": "...", "tenant": "..." }
#
# ── Set environment variables ──
# Windows PowerShell:
# $env:ARM_CLIENT_ID       = "<appId>"
# $env:ARM_CLIENT_SECRET   = "<password>"
# $env:ARM_TENANT_ID       = "<tenant>"
# $env:ARM_SUBSCRIPTION_ID = "<subscriptionId>"
#
# Linux / Mac:
# export ARM_CLIENT_ID="<appId>"
# export ARM_CLIENT_SECRET="<password>"
# export ARM_TENANT_ID="<tenant>"
# export ARM_SUBSCRIPTION_ID="<subscriptionId>"`,
      codeExplainer: `The provider.tf has zero credentials — this is intentional. The azurerm provider checks for ARM_* environment variables first, then falls back to Azure CLI. This single provider.tf works for both your laptop (CLI auth) and your Azure DevOps pipeline (service principal env vars) without modification.`,
      warnings: [
        "Never put ARM_CLIENT_SECRET in .tf files or .tfvars committed to git.",
        "Service principal password is shown ONCE during creation — save it to a Key Vault immediately.",
        "Contributor role is broad — in production, scope the SP to a specific resource group, not the whole subscription.",
        "Run terraform init again any time you change required_providers or backend configuration.",
      ],
    },
    lab: {
      intro:
        "Create a Service Principal, configure authentication via environment variables, and verify Terraform can connect to Azure.",
      steps: [
        {
          title: "Get your Subscription ID",
          desc: `Run:\naz account show --query id -o tsv\n\nCopy the GUID output — this is your ARM_SUBSCRIPTION_ID.\n\nIf you have multiple subscriptions:\naz account list --output table\n\nThen set the right one:\naz account set --subscription "Your Subscription Name"`,
        },
        {
          title: "Create the Service Principal",
          desc: `Run:\naz ad sp create-for-rbac \\\n  --name "sp-terraform-learn" \\\n  --role Contributor \\\n  --scopes /subscriptions/YOUR_SUB_ID\n\nOutput:\n{\n  "appId": "xxxxxxxx-...",      <- ARM_CLIENT_ID\n  "password": "xxxxxxxx-...",  <- ARM_CLIENT_SECRET (save this!)\n  "tenant": "xxxxxxxx-...",    <- ARM_TENANT_ID\n  "displayName": "sp-terraform-learn"\n}\n\nThe password is shown ONLY once. Save it somewhere secure.`,
        },
        {
          title: "Set environment variables",
          desc: `Windows PowerShell:\n$env:ARM_CLIENT_ID       = "your-appId"\n$env:ARM_CLIENT_SECRET   = "your-password"\n$env:ARM_TENANT_ID       = "your-tenant"\n$env:ARM_SUBSCRIPTION_ID = "your-sub-id"\n\nLinux/Mac:\nexport ARM_CLIENT_ID="your-appId"\nexport ARM_CLIENT_SECRET="your-password"\nexport ARM_TENANT_ID="your-tenant"\nexport ARM_SUBSCRIPTION_ID="your-sub-id"\n\nNote: these env vars only last the current terminal session.`,
        },
        {
          title: "Create provider.tf and versions.tf",
          desc: `Create versions.tf with the terraform{} block pinning azurerm ~> 3.85.\n\nCreate provider.tf with the provider "azurerm" block — do NOT include any credential attributes. They come from env vars automatically.\n\nNever put subscription_id, client_id, client_secret, or tenant_id as attributes in provider.tf.`,
        },
        {
          title: "Verify authentication works",
          desc: `Add to main.tf:\n\ndata "azurerm_subscription" "current" {}\n\noutput "sub_name" {\n  value = data.azurerm_subscription.current.display_name\n}\n\nRun:\nterraform init\nterraform plan\n\nIf it outputs your subscription display name — authentication works.`,
        },
        {
          title: "Check .terraform.lock.hcl",
          desc: `Open .terraform.lock.hcl in your editor.\n\nYou'll see:\nprovider "registry.terraform.io/hashicorp/azurerm" {\n  version     = "3.xx.x"\n  constraints = "~> 3.85"\n  hashes = [\n    "h1:...",\n    ...\n  ]\n}\n\nThese hashes verify provider binary integrity. Commit this file to git — it ensures your team uses the exact same provider version and binary.`,
        },
      ],
    },
    challenge: {
      task: `Create a provider.tf that works for BOTH local development (az login / CLI auth) and CI/CD pipelines (service principal env vars) without any modification between environments. Add comments explaining exactly how Terraform decides which auth method to use. Then add a data source that outputs whether you're authenticated as a user or service principal (use the azurerm_client_config data source).`,
      hints: [
        `The azurerm provider auto-detects: if ARM_CLIENT_ID + ARM_CLIENT_SECRET + ARM_TENANT_ID are set → Service Principal`,
        `If those env vars are absent → falls back to Azure CLI (az login)`,
        `data "azurerm_client_config" "current" {} gives you tenant_id, client_id, object_id`,
        `output the client_id — it will be your SP's appId when using SP auth, or your user's object ID when using CLI auth`,
      ],
      solution: `# provider.tf
# Auth method is auto-detected by azurerm provider:
# 1. ARM_CLIENT_ID + ARM_CLIENT_SECRET + ARM_TENANT_ID set → Service Principal (CI/CD)
# 2. ARM_USE_OIDC=true + ARM_CLIENT_ID → Federated/OIDC (GitHub Actions, Azure DevOps)
# 3. No ARM_* vars → Azure CLI fallback (local dev with az login)
# No credentials appear in this file — ever.

provider "azurerm" {
  features {}
}

data "azurerm_client_config" "current" {}

output "authenticated_as" {
  value = "Client ID: \${data.azurerm_client_config.current.client_id}"
}

output "tenant" {
  value = data.azurerm_client_config.current.tenant_id
}`,
    },
    deepDiveTopics: [
      "Azure Entra ID — tenants, apps, service principals explained",
      "OIDC federated identity — passwordless auth for GitHub Actions",
      "Managed Identity vs Service Principal — when to use which",
      "How the azurerm provider authenticates — source code walkthrough",
      "ARM_* environment variables — full list and what each does",
      ".terraform.lock.hcl — why it matters for team consistency",
    ],
  },
  {
    id: 3,
    phase: 1,
    type: "theory",
    title: "Variables, Outputs & Locals",
    subtitle: "Input variables, output values, local expressions, .tfvars files",
    theory: {
      intro: `Hardcoded values in Terraform configs make them brittle, non-reusable, and dangerous (secrets in code). Variables, outputs, and locals are the building blocks of flexible, parameterised infrastructure. Master these and you can deploy the same code to dev, staging, and prod without touching a single resource block.`,
      concepts: [
        {
          title: "Input Variables",
          body: `Variables are the parameters of your config. Define them with variable{} blocks — type (string/number/bool/list/map/object), optional default, description, and validation rules. If no default, Terraform prompts at runtime. Override via: -var flag, .tfvars files, or environment variables prefixed TF_VAR_.`,
        },
        {
          title: "Variable Types",
          body: `string = text value. number = integer or float. bool = true/false. list(string) = ordered ["a","b","c"]. map(string) = {key="val"}. set(string) = unique unordered (best for for_each). object({}) = structured with named fields. tuple([]) = fixed-length mixed-type list. For Azure resource configs, map(object()) is extremely useful for defining multiple similar resources.`,
        },
        {
          title: "Output Values",
          body: `Outputs are the return values of your config. Shown in terminal after apply. Stored in state and accessible by other configs via terraform_remote_state. Use sensitive = true for passwords/keys — they're hidden from terminal output but still in state. Outputs from child modules are accessed as module.module_name.output_name.`,
        },
        {
          title: "Local Values",
          body: `Locals are named expressions computed once and reused throughout the config. Define in locals{} block, reference as local.name. Best use: building resource names from variables (local.rg_name = "rg-\${var.project}-\${var.env}"), defining a shared tags map, and computing conditional values. Locals are never exposed outside the config — unlike outputs.`,
        },
        {
          title: ".tfvars Files",
          body: `Create dev.tfvars, staging.tfvars, prod.tfvars with different values. Apply with: terraform apply -var-file=dev.tfvars. Files named terraform.tfvars or *.auto.tfvars are loaded automatically. Never commit sensitive .tfvars (database passwords, API keys) to git — add them to .gitignore and use environment variables or a secrets manager instead.`,
        },
        {
          title: "Variable Validation",
          body: `Add validation{} blocks inside variable{} to reject invalid inputs before Terraform even tries to connect to Azure. condition uses any expression that returns bool. error_message is shown to the user. Common uses: restrict environment to allowed values, enforce naming length limits, validate CIDR format, ensure resource names are lowercase alphanumeric.`,
        },
      ],
      code: `# variables.tf
variable "project" {
  type        = string
  description = "Project name — used in all resource names"
  default     = "myapp"

  validation {
    condition     = length(var.project) <= 10 && can(regex("^[a-z0-9]+$", var.project))
    error_message = "Project must be lowercase alphanumeric, max 10 characters."
  }
}

variable "environment" {
  type    = string
  default = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be dev, staging, or prod."
  }
}

variable "location" {
  type    = string
  default = "East US"
}

# locals.tf — computed from variables
locals {
  prefix  = "\${var.project}-\${var.environment}"
  rg_name = "rg-\${local.prefix}"
  st_name = substr(replace("st\${var.project}\${var.environment}", "-", ""), 0, 24)

  tags = {
    project     = var.project
    environment = var.environment
    managed_by  = "terraform"
  }
}

# main.tf — uses locals, zero hardcoding
resource "azurerm_resource_group" "main" {
  name     = local.rg_name
  location = var.location
  tags     = local.tags
}

resource "azurerm_storage_account" "main" {
  name                     = local.st_name
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = var.environment == "prod" ? "GRS" : "LRS"
  tags                     = local.tags
}

# outputs.tf
output "resource_group_name" {
  description = "The RG name — used by other modules"
  value       = azurerm_resource_group.main.name
}

output "storage_connection_string" {
  description = "Primary connection string"
  value       = azurerm_storage_account.main.primary_connection_string
  sensitive   = true  # hidden from terminal, still in state
}`,
      codeExplainer: `local.st_name uses substr(replace(...)) to strip hyphens and limit to 24 chars — mandatory because Azure storage names must be lowercase alphanumeric only. The conditional account_replication_type = var.environment == "prod" ? "GRS" : "LRS" means prod gets geo-redundant storage, dev gets cheaper locally-redundant. Same code, different behaviour based on a single variable.`,
      warnings: [
        "Variable validation runs before provider connection — fast feedback for typos.",
        "sensitive = true hides output from terminal but the value IS still in terraform.tfstate in plaintext.",
        "Never use TF_VAR_ env vars for secrets in shared environments — they appear in process lists.",
        "locals{} cannot reference other local values defined in the same block — split into multiple locals{} blocks if needed.",
      ],
    },
    lab: {
      intro:
        "Refactor the Day 1 config to use proper variables, locals, and outputs. Deploy the same config for dev and prod using separate .tfvars files.",
      steps: [
        {
          title: "Create 4 separate files",
          desc: `variables.tf — all variable{} blocks\nlocals.tf — all local{} blocks\nmain.tf — resource and data blocks only\noutputs.tf — all output{} blocks\n\nThis separation is the standard pattern for any Terraform config larger than a toy example.`,
        },
        {
          title: "Define your variables",
          desc: `Add these variables:\n- project: string, default "learn", validation: lowercase alnum max 10\n- environment: string, default "dev", validation: only dev/staging/prod\n- location: string, default "East US"\n- location_short: string (for names), default "eus"\n\nAdd descriptions to all of them — treat your variables.tf as documentation.`,
        },
        {
          title: "Build locals",
          desc: `locals {\n  prefix  = "\${var.project}-\${var.environment}"\n  rg_name = "rg-\${local.prefix}-\${var.location_short}"\n  tags = {\n    project     = var.project\n    environment = var.environment\n    managed_by  = "terraform"\n  }\n}\n\nNow every resource name is derived from two variables. Change var.project once — all names update.`,
        },
        {
          title: "Update main.tf",
          desc: `Replace all hardcoded strings with local references:\n- name = local.rg_name\n- location = var.location\n- tags = local.tags\n\nNo hardcoded strings should remain in main.tf. If you see a quoted string that isn't a resource type or attribute name, it should probably be a variable or local.`,
        },
        {
          title: "Create .tfvars files",
          desc: `dev.tfvars:\nproject        = "learn"\nenvironment    = "dev"\nlocation       = "East US"\nlocation_short = "eus"\n\nprod.tfvars:\nproject        = "learn"\nenvironment    = "prod"\nlocation       = "West Europe"\nlocation_short = "we"`,
        },
        {
          title: "Deploy both environments",
          desc: `terraform apply -var-file=dev.tfvars\n(verify RG in portal)\n\nterraform apply -var-file=prod.tfvars\n(RG names are different — both exist simultaneously)\n\nRun:\nterraform output\nterraform output resource_group_name\n\nFor sensitive outputs:\nterraform output -json storage_connection_string`,
        },
      ],
    },
    challenge: {
      task: `Add a variable 'vm_size' of type string with a default of 'Standard_B2s'. Add a validation that checks the value starts with 'Standard_' (to prevent accidentally using deprecated 'Basic_' SKUs). Additionally, create a local called 'is_prod' that is true when var.environment == "prod", and use it to set a different vm_size in prod: Standard_D2s_v3 in prod vs Standard_B2s in dev — all from a single local, no extra variables.`,
      hints: [
        `For validation: condition = can(regex("^Standard_", var.vm_size))`,
        `For is_prod local: is_prod = var.environment == "prod"`,
        `Conditional local: effective_vm_size = local.is_prod ? "Standard_D2s_v3" : var.vm_size`,
        `Now var.vm_size can be overridden per environment, but also has a smart default based on environment`,
      ],
      solution: `variable "vm_size" {
  type    = string
  default = "Standard_B2s"
  validation {
    condition     = can(regex("^Standard_", var.vm_size))
    error_message = "vm_size must use Standard SKU (start with 'Standard_')."
  }
}

locals {
  is_prod          = var.environment == "prod"
  effective_vm_size = local.is_prod ? "Standard_D2s_v3" : var.vm_size
  tags = {
    project     = var.project
    environment = var.environment
    managed_by  = "terraform"
  }
}

output "vm_size_used" {
  value = "Will use: \${local.effective_vm_size}"
}`,
    },
    deepDiveTopics: [
      "Type system deep dive — object, tuple, any and type coercion",
      "Variable precedence — which source wins when multiple are set",
      "sensitive variables — how they work in state, plans, and logs",
      "can() and try() functions — safe validation expressions",
      "Complex locals — for expressions, conditional expressions, flatten()",
      ".tfvars vs TF_VAR_ env vars — when to use which",
    ],
  },
  {
    id: 4,
    phase: 1,
    type: "theory",
    title: "State Management & Data Sources",
    subtitle: "terraform.tfstate internals, state commands, importing resources",
    theory: {
      intro: `Terraform state is the single most important thing to understand correctly. It maps your HCL config to real Azure resource IDs. Misunderstanding or mishandling state is the number one source of Terraform disasters in production. Today we go deep on what state contains, how to manage it, and how to use data sources to reference infrastructure you didn't create.`,
      concepts: [
        {
          title: "What is in terraform.tfstate",
          body: `State is a JSON file with a 'resources' array. Each entry maps a Terraform resource address (azurerm_resource_group.main) to its real Azure ID (/subscriptions/.../resourceGroups/rg-myapp-dev) plus all attribute values. When you run plan, Terraform does a 3-way diff: HCL config vs state vs live Azure API. Changes outside Terraform (portal edits) are detected on the next plan.`,
        },
        {
          title: "State file dangers",
          body: `Never edit terraform.tfstate manually. Never delete it unless you know exactly what you're doing. If state is lost, Terraform thinks all resources are new — apply would create duplicates and destroy originals. State can contain sensitive data (connection strings, passwords) in plaintext — protect it with Azure Blob Storage encryption and access control.`,
        },
        {
          title: "terraform state commands",
          body: `terraform state list — show all tracked resources. terraform state show resource.name — show all attributes of a resource. terraform state rm resource.name — remove from state without deleting from Azure (use when you want Terraform to 'forget' a resource). terraform state mv — rename a resource in state without recreating. terraform state pull — fetch remote state as JSON.`,
        },
        {
          title: "terraform import",
          body: `Brings an existing Azure resource under Terraform management. Two steps: (1) Add the resource block to your HCL. (2) Run terraform import resource.address azure_resource_id. Terraform populates state for that resource. Then run plan — it should show no changes if your HCL matches reality. Common use: taking over resources that were clicked in the portal.`,
        },
        {
          title: "Data Sources",
          body: `data{} blocks read existing resources without creating them. You can look up VNets, Key Vaults, RGs, subscription info, and hundreds more. Reference their attributes exactly like resource attributes: data.azurerm_resource_group.existing.location. Essential for connecting Terraform-managed resources to pre-existing infrastructure.`,
        },
        {
          title: "lifecycle Meta-argument",
          body: `lifecycle{} block inside a resource controls Terraform's behaviour: prevent_destroy = true makes terraform destroy fail for that resource — safety net for production databases. create_before_destroy = true creates a replacement before deleting the old one (zero-downtime). ignore_changes = [tags] tells Terraform to ignore changes to specific attributes (e.g. tags managed by Azure Policy).`,
        },
      ],
      code: `# data sources — reading EXISTING Azure resources
data "azurerm_resource_group" "existing" {
  name = "rg-existing-prod"
}

data "azurerm_client_config" "current" {}

data "azurerm_key_vault" "existing" {
  name                = "kv-myapp-prod"
  resource_group_name = data.azurerm_resource_group.existing.name
}

# Use data source output in a new resource
resource "azurerm_storage_account" "app" {
  name                     = "stmyappprod001"
  resource_group_name      = data.azurerm_resource_group.existing.name
  location                 = data.azurerm_resource_group.existing.location
  account_tier             = "Standard"
  account_replication_type = "GRS"
}

# lifecycle — protect production resources
resource "azurerm_resource_group" "prod" {
  name     = "rg-myapp-prod-eus"
  location = "East US"

  lifecycle {
    prevent_destroy = true
    ignore_changes  = [tags]  # Azure Policy manages tags
  }
}

# terraform state commands reference:
# terraform state list
# terraform state show azurerm_resource_group.main
# terraform state rm azurerm_resource_group.main
# terraform state mv azurerm_resource_group.main azurerm_resource_group.primary

# import existing RG (run in terminal, not in .tf files):
# terraform import azurerm_resource_group.existing \\
#   /subscriptions/<SUB_ID>/resourceGroups/rg-existing-prod`,
      codeExplainer: `data.azurerm_resource_group.existing.name reads the name from Azure — useful if the RG already existed before Terraform. prevent_destroy = true blocks terraform destroy for that specific resource even if you run terraform destroy on the whole config. ignore_changes = [tags] is critical in environments where Azure Policy auto-assigns tags — without it, every plan shows a spurious tag diff.`,
      warnings: [
        "Local state (terraform.tfstate) is for dev only. Use Azure Blob backend for any shared or production config.",
        "terraform state rm only removes from state — the Azure resource still exists. Use for decoupling, not deletion.",
        "After terraform import, always run terraform plan to check your HCL matches reality before touching anything.",
        "sensitive values in state are stored in plaintext — restrict access to state files like you would a secrets file.",
      ],
    },
    lab: {
      intro:
        "Explore state hands-on: inspect state contents, practice state commands, and use data sources to reference existing infrastructure.",
      steps: [
        {
          title: "Inspect raw state",
          desc: `After any terraform apply, open terraform.tfstate in your editor.\n\nFind the "resources" array. Each resource has:\n- "type": "azurerm_resource_group"\n- "name": "main"\n- "instances": [{ "attributes": { "id": "/subscriptions/...", "name": "rg-...", ... }}]\n\nThe "id" is the actual Azure resource ID. This is what Terraform uses to talk to the Azure API.`,
        },
        {
          title: "terraform state list",
          desc: `Run:\nterraform state list\n\nOutput:\nazurerm_resource_group.main\n\nIf you have multiple resources:\nazurerm_resource_group.main\nazurerm_storage_account.main\ndata.azurerm_client_config.current\n\nNote: data sources appear in state list too.`,
        },
        {
          title: "terraform state show",
          desc: `Run:\nterraform state show azurerm_resource_group.main\n\nYou'll see every attribute:\nid       = "/subscriptions/.../resourceGroups/rg-learn-dev"\nlocation = "eastus"\nname     = "rg-learn-dev"\ntags     = { environment = "dev", managed_by = "terraform" }\n\nThis is extremely useful for debugging — shows the exact current state Terraform has recorded.`,
        },
        {
          title: "Add a data source",
          desc: `Add to main.tf:\n\ndata "azurerm_subscription" "current" {}\n\noutput "sub_display_name" {\n  value = data.azurerm_subscription.current.display_name\n}\n\noutput "sub_id" {\n  value = data.azurerm_subscription.current.id\n}\n\nRun terraform apply — no new Azure resources, but outputs appear.`,
        },
        {
          title: "Test prevent_destroy",
          desc: `Add to your resource group:\nlifecycle {\n  prevent_destroy = true\n}\n\nRun:\nterraform destroy\n\nExpected error:\n"Error: Instance cannot be destroyed"\n"Resource azurerm_resource_group.main has lifecycle.prevent_destroy"\n\nRemove the lifecycle block and run destroy again — now it works.`,
        },
        {
          title: "Practice terraform import",
          desc: `In Azure portal, manually create a resource group: rg-imported-test\n\nIn main.tf, add:\nresource "azurerm_resource_group" "imported" {\n  name     = "rg-imported-test"\n  location = "East US"\n}\n\nDo NOT run apply yet. Instead run:\nterraform import azurerm_resource_group.imported \\\n  /subscriptions/YOUR_SUB_ID/resourceGroups/rg-imported-test\n\nNow run terraform plan — it should show no changes if your HCL is correct.`,
        },
      ],
    },
    challenge: {
      task: `Write a Terraform config that uses ONLY data sources (no resource blocks) to output: your tenant ID, subscription display name, and the location of a resource group whose name you pass as a variable. The config should create zero Azure resources. Run terraform apply and confirm all 3 outputs appear without any resources being created.`,
      hints: [
        `data "azurerm_client_config" "current" {} gives tenant_id`,
        `data "azurerm_subscription" "current" {} gives display_name`,
        `data "azurerm_resource_group" "target" { name = var.rg_name } gives location`,
        `terraform plan should show: "Plan: 0 to add, 0 to change, 0 to destroy"`,
      ],
      solution: `variable "rg_name" {
  type        = string
  description = "Name of an existing resource group to inspect"
}

data "azurerm_client_config" "current" {}
data "azurerm_subscription" "current" {}

data "azurerm_resource_group" "target" {
  name = var.rg_name
}

output "tenant_id" {
  value = data.azurerm_client_config.current.tenant_id
}

output "subscription_name" {
  value = data.azurerm_subscription.current.display_name
}

output "rg_location" {
  value = data.azurerm_resource_group.target.location
}`,
    },
    deepDiveTopics: [
      "terraform.tfstate JSON structure — full breakdown of every field",
      "Remote state backends — Azure Blob vs Terraform Cloud vs S3",
      "State locking — how Azure Blob lease prevents concurrent runs",
      "terraform refresh vs plan -refresh-only — what changed in TF 0.15+",
      "State drift — detecting and reconciling portal changes",
      "Partial state — what happens when apply fails halfway through",
    ],
  },
  {
    id: 5,
    phase: 1,
    type: "project",
    title: "PROJECT — Azure Baseline Setup",
    subtitle: "Resource Group + Storage Account + Key Vault with proper patterns",
    theory: {
      intro: `Today you build your first complete, production-pattern Azure baseline. This is what real Terraform projects start with: a resource group containing a storage account and a Key Vault, all wired together with proper variables, outputs, locals, conditional logic, and naming conventions. By the end you'll have a reusable pattern you can use for every client engagement.`,
      concepts: [
        {
          title: "Project goal",
          body: `Build a baseline module deployable to any environment. The RG contains: (1) Storage Account — for app data, later for Terraform state itself. (2) Key Vault — for secrets, certificates, keys. All names follow the Azure CAF (Cloud Adoption Framework) naming convention. The same code deploys to dev (cheap, no purge protection) and prod (GRS storage, purge protection enabled) via a single variable change.`,
        },
        {
          title: "Azure Storage Account naming",
          body: `The most common Terraform beginner error. Rules: 3–24 chars, lowercase alphanumeric ONLY, globally unique across all of Azure. No hyphens, no underscores, no uppercase. Use: substr(replace("st\${var.project}\${var.environment}", "-", ""), 0, 24). Add a random suffix for global uniqueness. The random provider (hashicorp/random) generates a stable 4-char suffix.`,
        },
        {
          title: "Key Vault soft delete behaviour",
          body: `Azure Key Vaults have soft delete enabled by default — a 'deleted' KV sits in a recoverable state for 7–90 days. During this time, you can't create a new KV with the same name. In dev, set purge_protection_enabled = false and add the features block to auto-purge on destroy. In prod, keep purge_protection_enabled = true — it prevents accidental or malicious deletion.`,
        },
        {
          title: "Implicit vs explicit dependencies",
          body: `Terraform builds a dependency graph from resource references. azurerm_storage_account references azurerm_resource_group.main.name → implicit dependency: RG creates first. azurerm_key_vault references the same RG → also implicit. You only need explicit depends_on when a dependency exists logically but isn't expressed through attribute references. In this project, everything is implicit.`,
        },
      ],
      code: `# Complete 5-file project structure:
# versions.tf, provider.tf, variables.tf, locals.tf, main.tf, outputs.tf

# locals.tf
locals {
  prefix   = "\${var.project}-\${var.environment}"
  rg_name  = "rg-\${local.prefix}-\${var.location_short}"
  st_name  = substr(replace("st\${var.project}\${var.environment}", "-", ""), 0, 20)
  kv_name  = "kv-\${local.prefix}-001"
  tags = {
    project     = var.project
    environment = var.environment
    managed_by  = "terraform"
    created_by  = data.azurerm_client_config.current.client_id
  }
}

# main.tf
data "azurerm_client_config" "current" {}

resource "azurerm_resource_group" "main" {
  name     = local.rg_name
  location = var.location
  tags     = local.tags
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

  access_policy {
    tenant_id = data.azurerm_client_config.current.tenant_id
    object_id = data.azurerm_client_config.current.object_id
    secret_permissions = ["Get","List","Set","Delete","Purge","Recover"]
  }
  tags = local.tags
}`,
      codeExplainer: `Three key patterns here: (1) Conditional replication type — one expression handles dev vs prod storage. (2) purge_protection_enabled = var.environment == "prod" — same pattern for KV. (3) access_policy references data.azurerm_client_config.current.object_id — this gives Terraform's own identity (your SP or CLI user) permission to manage secrets without hardcoding any IDs.`,
      warnings: [
        "Key Vault name must be 3–24 chars, start with a letter, alphanumeric and hyphens only.",
        "If KV destroy fails with 'soft-delete', add purge_protection_enabled=false and the features block.",
        "access_policy with your own object_id is required to create secrets via Terraform — without it, even the resource creator can't write secrets.",
        "min_tls_version = 'TLS1_2' is an Azure security baseline requirement — include it by default.",
      ],
    },
    lab: {
      intro:
        "Build and deploy the complete baseline. Both environments. Verify conditional logic works correctly. Destroy cleanly.",
      steps: [
        {
          title: "Create the full project",
          desc: `New folder: baseline/\n\nFiles:\n- versions.tf (terraform + provider declarations)\n- provider.tf (azurerm with features block)\n- variables.tf (project, environment, location, location_short)\n- locals.tf (prefix, rg_name, st_name, kv_name, tags)\n- main.tf (data source + 3 resources)\n- outputs.tf (6 outputs)\n- dev.tfvars\n- prod.tfvars`,
        },
        {
          title: "Add all 6 outputs",
          desc: `output "resource_group_name" { value = azurerm_resource_group.main.name }\noutput "resource_group_id"   { value = azurerm_resource_group.main.id }\noutput "storage_account_name"{ value = azurerm_storage_account.main.name }\noutput "storage_connection_string" {\n  value     = azurerm_storage_account.main.primary_connection_string\n  sensitive = true\n}\noutput "key_vault_uri" { value = azurerm_key_vault.main.vault_uri }\noutput "key_vault_id"  { value = azurerm_key_vault.main.id }`,
        },
        {
          title: "Deploy dev environment",
          desc: `terraform init\nterraform apply -var-file=dev.tfvars\n\nVerify in portal:\n- RG name follows convention\n- Storage Account has LRS replication\n- Key Vault has purge_protection = false\n\nRun: terraform output\nShould show all outputs. Connection string should show (sensitive value).`,
        },
        {
          title: "Deploy prod environment",
          desc: `terraform apply -var-file=prod.tfvars\n\nVerify:\n- Different RG name (prod suffix)\n- Storage Account has GRS replication\n- Key Vault has purge_protection = true\n\nBoth dev and prod environments now exist simultaneously — same code, different configs.`,
        },
        {
          title: "Verify conditional logic",
          desc: `In Azure portal:\n- dev storage account → Replication: LRS\n- prod storage account → Replication: GRS (Geo-redundant)\n- dev KV → Purge protection: Disabled\n- prod KV → Purge protection: Enabled\n\nThis is the power of conditional expressions — same 6 files deploy correctly configured infrastructure for both environments.`,
        },
        {
          title: "Clean destroy",
          desc: `terraform destroy -var-file=prod.tfvars\nterraform destroy -var-file=dev.tfvars\n\nIf KV destroy fails on purge:\nAdd to provider features:\nkey_vault {\n  purge_soft_delete_on_destroy = true\n}\n\nThen re-run destroy. Both environments should destroy cleanly.`,
        },
      ],
    },
    challenge: {
      task: `Add a random_string resource from the hashicorp/random provider to generate a 6-character suffix for the storage account name (to ensure global uniqueness). The suffix must be stable — it should NOT regenerate every time you run apply. Use the keeper argument to tie the suffix to the project and environment values, so it only regenerates if those change.`,
      hints: [
        `Add hashicorp/random to required_providers in versions.tf`,
        `resource "random_string" "suffix" { length=6, special=false, upper=false }`,
        `keepers = { project = var.project, environment = var.environment } — makes suffix stable`,
        `local.st_name = "\${substr(replace("st\${var.project}\${var.environment}","-",""),0,18)}\${random_string.suffix.result}"`,
      ],
      solution: `# versions.tf — add random provider
terraform {
  required_providers {
    azurerm = { source = "hashicorp/azurerm", version = "~> 3.85" }
    random  = { source = "hashicorp/random",  version = "~> 3.5"  }
  }
}

# main.tf — add random_string resource
resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
  keepers = {
    project     = var.project
    environment = var.environment
  }
}

# locals.tf — incorporate suffix
locals {
  st_name = "\${substr(replace("st\${var.project}\${var.environment}", "-", ""), 0, 18)}\${random_string.suffix.result}"
}`,
    },
    deepDiveTopics: [
      "Azure CAF naming convention — full reference for all resource types",
      "Key Vault access policy vs RBAC — which to use in 2024",
      "Storage Account security hardening — all the flags you should set",
      "random provider — random_string vs random_id vs random_pet",
      "Terraform project structure at scale — mono-repo vs poly-repo patterns",
      "Cost optimisation — how to size dev vs prod resources correctly",
    ],
  },
];

// Generate stub days for 6–30
const stubTitles = {
  6: "Azure VNet, Subnets & CIDR Planning",
  7: "NSGs & Security Rules",
  8: "Public IPs, NICs & Virtual Machines",
  9: "Azure Load Balancer",
  10: "PROJECT — Hub-Spoke Network + VMs",
  11: "VM Scale Sets & Autoscaling",
  12: "Availability Zones & Sets",
  13: "Storage Accounts & Lifecycle Policies",
  14: "Azure Key Vault & Secrets Management",
  15: "Azure SQL Database",
  16: "Cosmos DB & Managed Databases",
  17: "PROJECT — 3-Tier App Infrastructure",
  18: "Writing Terraform Modules",
  19: "Remote State — Azure Blob Backend",
  20: "Terraform Workspaces",
  21: "HCP Terraform Cloud",
  22: "PROJECT — Multi-env Module Library",
  23: "Azure Kubernetes Service (AKS)",
  24: "App Service & Azure Functions",
  25: "Entra ID & RBAC with Terraform",
  26: "Microsoft Sentinel via Terraform",
  27: "PROJECT — AKS + Sentinel Platform",
  28: "CI/CD — Azure DevOps Pipelines",
  29: "Terragrunt & DRY Patterns",
  30: "CAPSTONE — Full Azure Landing Zone",
};

const stubSubtitles = {
  6: "VNet address spaces, subnet design, for_each subnets",
  7: "NSG rules, service tags, subnet associations",
  8: "Public IPs, NICs, Linux VMs, cloud-init",
  9: "Standard LB, backend pools, health probes, NAT rules",
  10: "Hub-spoke peering, Bastion, VM in spoke",
  11: "VMSS, autoscale profiles, CPU-based scaling",
  12: "Availability zones vs sets, zone-redundant resources",
  13: "Storage tiers, lifecycle management, blob containers",
  14: "Key Vault secrets, access policies, data sources",
  15: "SQL Server, databases, firewall rules, elastic pools",
  16: "Cosmos DB accounts, databases, throughput",
  17: "LB + VMs + SQL + Key Vault wired together",
  18: "Module structure, variables/outputs, calling modules",
  19: "azurerm backend, state locking, remote_state data source",
  20: "terraform workspace commands, workspace-aware vars",
  21: "HCP Terraform, remote runs, VCS-driven workflows",
  22: "Reusable module library, multi-env deployment",
  23: "AKS cluster, node pools, RBAC, CNI networking",
  24: "App Service Plan, Web Apps, Function Apps",
  25: "azuread provider, service principals, role assignments",
  26: "Sentinel onboarding, connectors, analytic rules",
  27: "AKS + Defender + Sentinel + diagnostic settings",
  28: "YAML pipelines, terraform plan in PR, apply on merge",
  29: "Terragrunt, DRY config, dependency blocks",
  30: "Management groups, policies, full landing zone",
};

const projectDays = new Set([10, 17, 22, 27, 30]);
const advancedDays = new Set([23, 24, 25, 26, 28, 29]);

for (let d = 6; d <= 30; d++) {
  if (!days.find((x) => x.id === d)) {
    const phaseEntry = phases.find((p) => p.days.includes(d));
    days.push({
      id: d,
      phase: phaseEntry ? phaseEntry.id : 1,
      type: projectDays.has(d)
        ? "project"
        : advancedDays.has(d)
        ? "advanced"
        : "theory",
      title: stubTitles[d] || `Day ${d}`,
      subtitle: stubSubtitles[d] || "",
      theory: {
        intro: `Day ${d} covers ${stubTitles[d]}. Full content with code examples, explanations, and Azure-specific guidance is available through the AI deep dive.`,
        concepts: [
          {
            title: "Getting started",
            body: `Use the AI Deep Dive button to get complete theory for this day. You can ask for specific concepts, code walkthroughs, or comparisons with other approaches.`,
          },
        ],
        code: `# Day ${d} — ${stubTitles[d]}\n# Click "AI Deep Dive" for complete code examples`,
        codeExplainer: `Full code examples and explanations available via AI Deep Dive.`,
        warnings: [],
      },
      lab: {
        intro: `Hands-on lab for Day ${d}: ${stubTitles[d]}`,
        steps: [
          {
            title: "Use AI Deep Dive",
            desc: `Click the "AI Deep Dive" button on this page and ask:\n"Give me the complete Day ${d} Terraform lab on ${stubTitles[d]}"\n\nThe AI will provide a full step-by-step lab tailored to your environment.`,
          },
        ],
      },
      challenge: {
        task: `Daily challenge for Day ${d}: ${stubTitles[d]}. Click "AI Deep Dive" for your challenge and hints.`,
        hints: [`Click AI Deep Dive to get your hints for Day ${d}.`],
        solution: `// Click AI Deep Dive to reveal the solution after attempting the challenge.`,
      },
      deepDiveTopics: [
        `Core concepts of ${stubTitles[d]}`,
        `Azure-specific considerations for Day ${d}`,
        `Common mistakes and how to avoid them`,
        `Production patterns and best practices`,
        `Integration with other Azure services`,
      ],
    });
  }
}

module.exports = { phases, days };
