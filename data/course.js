const phases = [
  { id:1, name:"Foundation",          color:"#1D9E75", bg:"#E1F5EE", textColor:"#085041", days:[1,2,3,4,5] },
  { id:2, name:"Networking & Compute", color:"#378ADD", bg:"#E6F1FB", textColor:"#0C447C", days:[6,7,8,9,10,11,12] },
  { id:3, name:"Storage & Databases",  color:"#D85A30", bg:"#FAECE7", textColor:"#712B13", days:[13,14,15,16,17] },
  { id:4, name:"Modules & State",      color:"#7F77DD", bg:"#EEEDFE", textColor:"#3C3489", days:[18,19,20,21,22] },
  { id:5, name:"Advanced Azure",       color:"#BA7517", bg:"#FAEEDA", textColor:"#633806", days:[23,24,25,26,27] },
  { id:6, name:"CI/CD & Capstone",     color:"#D4537E", bg:"#FBEAF0", textColor:"#72243E", days:[28,29,30] },
];

const days = [
// ─── DAY 1 ───────────────────────────────────────────────────────────────────
{
  id:1, phase:1, type:"theory",
  title:"Terraform & IaC Fundamentals",
  subtitle:"What IaC is, how Terraform works, HCL syntax basics",
  theory:{
    intro:`Infrastructure as Code (IaC) means defining your servers, networks, and databases using code files instead of clicking through a portal. This gives you version control, repeatability, and automation. Without IaC every deployment is a manual, undocumented process. With IaC your infrastructure lives in a Git repo — reviewable, repeatable, and shareable across a team.`,
    concepts:[
      { title:"What is Terraform?", body:`Terraform is an open-source IaC tool by HashiCorp. You write configuration files in HCL (HashiCorp Configuration Language) and Terraform figures out what to create, change, or delete in your cloud provider. It compares desired state (your code) against current state (the state file) and makes only the necessary changes — this is called idempotency. Run it twice, get the same result.` },
      { title:"Terraform vs ARM vs Bicep", body:`ARM templates are JSON-heavy and Azure-only — a simple VM is 200+ lines of raw JSON. Bicep is Microsoft's cleaner replacement, great syntax but still Azure-only. Terraform works across Azure, AWS, GCP, and even SaaS tools like GitHub and Datadog. For consultants working with multiple clients, Terraform is the industry standard — one tool, one workflow regardless of cloud.` },
      { title:"Terraform Core Architecture", body:`Three components: (1) Core — the terraform CLI binary, reads HCL, computes diffs, executes changes. (2) Providers — plugins that talk to cloud APIs. azurerm talks to Azure Resource Manager. Downloaded via terraform init into .terraform/ folder. (3) State — terraform.tfstate file that maps your HCL config to real Azure resource IDs. This is the memory of Terraform — never delete it.` },
      { title:"The Terraform Workflow", body:`Write HCL → terraform init (downloads provider) → terraform plan (preview changes, nothing created yet) → terraform apply (creates resources in Azure) → terraform destroy (cleans up). The plan step is critical — always read every + (create), ~ (update), - (destroy) line before typing yes. This workflow is what you run every single day.` },
      { title:"HCL Block Types", body:`terraform{} declares required providers and Terraform version. provider{} configures the cloud connection. resource{} creates something in Azure. data{} reads an existing resource without creating it. variable{} defines input parameters. locals{} defines computed internal values. output{} exports values after apply. These seven block types cover 95% of everything you will ever write.` },
      { title:"Azure Resource Group — The Container", body:`Unlike AWS where most resources are region-level, every Azure resource must live inside a Resource Group. VMs, VNets, Storage Accounts, Key Vaults — all require resource_group_name. The RG is the unit for billing, RBAC, and lifecycle. In Terraform: create the RG first, then reference it by name in every other resource. Terraform resolves this dependency automatically.` },
    ],
    code:`# versions.tf — always pin your provider version
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.85"   # ~> allows 3.85.x but NOT 4.x
    }
  }
}

# provider.tf
provider "azurerm" {
  features {}   # required block, leave empty for now
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

# outputs.tf
output "rg_name" {
  description = "The resource group name"
  value       = azurerm_resource_group.main.name
}
output "rg_id" {
  value = azurerm_resource_group.main.id
}`,
    codeExplainer:`required_version pins the Terraform CLI itself. ~> 3.85 allows 3.85.x patch updates but blocks the 4.x major version to prevent breaking changes. features{} is mandatory for azurerm — leave it empty for now. In the resource block "azurerm_resource_group" is the TYPE and "main" is your local label — together they form the address azurerm_resource_group.main used when referencing this resource elsewhere. output reads .name from state after creation.`,
    warnings:[
      "Never run terraform apply without reading the full plan first — a misplaced destroy is irreversible for databases.",
      "Storage account names: lowercase alphanumeric only, 3–24 chars, globally unique. No hyphens allowed.",
      "Always run terraform destroy after labs — Azure bills by the second. An idle VM costs money.",
      "Never manually edit terraform.tfstate — corruption causes Terraform to lose track of all managed resources.",
    ],
  },
  lab:{
    intro:"Set up your Terraform environment from scratch. You will install both tools, write your first HCL file, and run the complete workflow against real Azure infrastructure.",
    steps:[
      { title:"Install Terraform CLI", desc:`Windows: download the zip from developer.hashicorp.com/terraform/downloads, extract terraform.exe to C:\\tools\\terraform, add that folder to your PATH environment variable.\n\nLinux/Mac:\nbrew install terraform\n\nVerify the install:\nterraform -version\n\nExpected output: Terraform v1.x.x — if you see this, you are ready.` },
      { title:"Install Azure CLI", desc:`Follow the guide at docs.microsoft.com/en-us/cli/azure/install-azure-cli for your OS.\n\nAfter install, authenticate:\naz login\n\nA browser window opens — sign in with your Azure account.\n\nVerify:\naz account show\n\nYou should see your subscription name and ID in the output.` },
      { title:"Create your project folder", desc:`mkdir terraform-day1\ncd terraform-day1\n\nCreate three files in this folder:\n- versions.tf\n- provider.tf\n- main.tf\n\nPaste the matching code from the Theory section into each file. Terraform reads ALL .tf files in the directory — filename and order do not matter.` },
      { title:"Run terraform init", desc:`terraform init\n\nTerraform downloads the azurerm provider plugin into .terraform/ and creates .terraform.lock.hcl which locks the exact provider version checksums.\n\nExpected output:\n"Terraform has been successfully initialized!"\n\nIf you see errors: check your internet connection and confirm you are in the correct folder.` },
      { title:"Run terraform plan — read it carefully", desc:`terraform plan\n\nTerraform connects to Azure and shows exactly what it will create:\n+ azurerm_resource_group.main will be created\n  + id       = (known after apply)\n  + location = "eastus"\n  + name      = "rg-myapp-dev-eus"\n\nThe + sign means CREATE. Nothing exists in Azure yet — this is only a preview. Always read every line before applying.` },
      { title:"Run terraform apply", desc:`terraform apply\n\nTerraform shows the plan again and prompts:\nDo you want to perform these actions? Enter a value:\n\nType: yes\n\nAfter about 10 seconds:\nApply complete! Resources: 1 added, 0 changed, 0 destroyed.\n\nYour resource group now exists in Azure.` },
      { title:"Verify in Azure portal", desc:`Open portal.azure.com and navigate to Resource Groups.\n\nYou should see: rg-myapp-dev-eus\nClick it and check the Tags tab: environment=dev, managed_by=terraform\n\nThis confirms Terraform created exactly what you defined in code.` },
      { title:"Run terraform destroy", desc:`terraform destroy\n\nType: yes when prompted.\n\nTerraform deletes the resource group and everything inside it.\n\nDestroy complete! Resources: 1 destroyed.\n\nAlways run destroy after each lab to avoid unexpected Azure charges.` },
    ],
  },
  challenge:{
    task:`Write a Terraform config that creates 3 resource groups — dev, staging, and prod — using a SINGLE resource block with for_each. Each RG name must follow the pattern rg-learn-{environment}. Each RG must have a tag with its environment name. You are NOT allowed to copy-paste the resource block three times.`,
    hints:[
      `Declare a variable of type set(string) with default ["dev","staging","prod"]`,
      `Use for_each = var.environments on the resource block`,
      `Reference the current iteration value with each.key inside the block`,
      `The name becomes: "rg-learn-\${each.key}"`,
    ],
    solution:`variable "environments" {
  type    = set(string)
  default = ["dev", "staging", "prod"]
}

resource "azurerm_resource_group" "env" {
  for_each = var.environments
  name     = "rg-learn-\${each.key}"
  location = "East US"
  tags     = { environment = each.key, managed_by = "terraform" }
}

output "rg_names" {
  value = { for k, v in azurerm_resource_group.env : k => v.name }
}`,
  },
  deepDiveTopics:[
    "How does terraform plan work internally — step by step",
    "Terraform state file deep dive — what is inside terraform.tfstate",
    "~> version constraint vs >= vs = — which to use and when",
    "Terraform dependency graph — how resource ordering is determined",
    "for_each vs count — when to use which and why",
    "HCL type system — string, number, bool, list, map, object",
  ],
},
// ─── DAY 2 ───────────────────────────────────────────────────────────────────
{
  id:2, phase:1, type:"theory",
  title:"Azure Provider & Authentication",
  subtitle:"Service principals, env vars, auth methods, terraform init deep dive",
  theory:{
    intro:`Before Terraform can create anything in Azure it must authenticate to the Azure Resource Manager API. There are four ways to do this and choosing the right one matters for security and CI/CD pipelines. For local development Azure CLI auth is the simplest. For automated pipelines a Service Principal is the standard. Understanding the difference — and why you never hardcode credentials — is the foundation of secure Terraform work.`,
    concepts:[
      { title:"Four Authentication Methods", body:`(1) Azure CLI — uses your active az login session. Zero config, perfect for local dev. (2) Service Principal + Client Secret — an app identity with a password stored in env vars. Standard for CI/CD pipelines. (3) Service Principal + Certificate — more secure than secret, uses a certificate file instead of a password. (4) Managed Identity — for VMs or Azure DevOps agents running inside Azure itself, no credentials needed at all. The azurerm provider auto-detects which method to use based on environment variables present.` },
      { title:"What is a Service Principal?", body:`A Service Principal is a service account in Azure Entra ID (formerly Azure AD). It is an application identity — not a human. Terraform uses it to authenticate as an app rather than as you personally. It needs a Role Assignment to do anything useful: typically Contributor on the subscription for learning, or scoped to a specific resource group in production. Create it once with az ad sp create-for-rbac — the password is shown only once so save it immediately.` },
      { title:"Environment Variables — Never Hardcode", body:`The azurerm provider reads four environment variables: ARM_CLIENT_ID (the service principal app ID), ARM_CLIENT_SECRET (the password), ARM_TENANT_ID (your Azure AD tenant GUID), and ARM_SUBSCRIPTION_ID (which subscription to target). Set these in your shell session and your provider.tf stays completely credential-free. Never put secrets in .tf files or .tfvars files that get committed to git.` },
      { title:"terraform init in Depth", body:`init does three things: (1) Downloads provider plugins from the Terraform Registry into the .terraform/ directory. (2) Creates .terraform.lock.hcl — locks exact provider version checksums so every team member and CI runner uses identical provider binaries. (3) Initialises the backend — where state is stored, local by default. Run init again whenever you add a new provider, change backend config, or upgrade a provider version.` },
      { title:"The features{} Block", body:`features{} is required in the azurerm provider but can be empty. It controls optional provider behaviours: key_vault { purge_soft_delete_on_destroy = true } deletes Key Vaults immediately in dev instead of waiting 90 days. virtual_machine { delete_os_disk_on_deletion = true } removes the OS disk when you delete a VM. For Day 2 leave it empty — we will configure it properly in the Key Vault day.` },
      { title:"Multi-file Config Best Practice", body:`Split your config across multiple .tf files: versions.tf for the terraform{} block, provider.tf for provider{}, main.tf for resources, variables.tf for variable{} blocks, outputs.tf for output{} blocks, locals.tf for local{} blocks. Terraform reads ALL .tf files in the directory simultaneously — order and filename do not matter. This separation makes large configs navigable and prevents merge conflicts in team environments.` },
    ],
    code:`# versions.tf
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.85"
    }
  }
}

# provider.tf — zero credentials in this file, ever
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
}

# ── Create a Service Principal (run ONCE in terminal, not in Terraform) ──
# az ad sp create-for-rbac \\
#   --name "sp-terraform-learn" \\
#   --role Contributor \\
#   --scopes /subscriptions/<SUBSCRIPTION_ID>
#
# Output: { "appId": "...", "password": "...", "tenant": "..." }
# Save the password immediately — shown only once.
#
# ── Set environment variables (Windows PowerShell) ──
# $env:ARM_CLIENT_ID       = "<appId>"
# $env:ARM_CLIENT_SECRET   = "<password>"
# $env:ARM_TENANT_ID       = "<tenant>"
# $env:ARM_SUBSCRIPTION_ID = "<subscriptionId>"
#
# ── Set environment variables (Linux / Mac) ──
# export ARM_CLIENT_ID="<appId>"
# export ARM_CLIENT_SECRET="<password>"
# export ARM_TENANT_ID="<tenant>"
# export ARM_SUBSCRIPTION_ID="<subscriptionId>"

# Verify auth works — add to main.tf temporarily
data "azurerm_subscription" "current" {}
output "sub_name" {
  value = data.azurerm_subscription.current.display_name
}`,
    codeExplainer:`The provider.tf contains zero credentials — this is intentional and correct. The azurerm provider checks for ARM_* environment variables first, then falls back to Azure CLI. This single provider.tf file works for your laptop (CLI auth) and your Azure DevOps pipeline (service principal env vars) without any modification. The data block at the bottom is a quick auth verification — if terraform plan outputs your subscription name, authentication is working.`,
    warnings:[
      "Never put ARM_CLIENT_SECRET in .tf files or .tfvars files committed to git — rotate the secret immediately if this happens.",
      "The service principal password is displayed only once during creation — save it to a Key Vault right away.",
      "Contributor role is broad — in production scope the SP to a specific resource group, not the entire subscription.",
      "Commit .terraform.lock.hcl to git — it ensures your team uses the exact same provider binary with verified checksums.",
    ],
  },
  lab:{
    intro:"Create a Service Principal, configure environment variable authentication, and verify Terraform can connect to your Azure subscription.",
    steps:[
      { title:"Get your Subscription ID", desc:`Run:\naz account show --query id -o tsv\n\nCopy the GUID — this is your ARM_SUBSCRIPTION_ID.\n\nIf you have multiple subscriptions:\naz account list --output table\n\nSet the correct one:\naz account set --subscription "Your Subscription Name"` },
      { title:"Create the Service Principal", desc:`az ad sp create-for-rbac \\\n  --name "sp-terraform-learn" \\\n  --role Contributor \\\n  --scopes /subscriptions/YOUR_SUB_ID\n\nOutput:\n{\n  "appId": "xxxxxxxx",    <- ARM_CLIENT_ID\n  "password": "xxxxxxxx", <- ARM_CLIENT_SECRET (save now!)\n  "tenant": "xxxxxxxx"    <- ARM_TENANT_ID\n}\n\nThe password is shown only once. Copy it immediately.` },
      { title:"Set environment variables", desc:`Windows PowerShell:\n$env:ARM_CLIENT_ID       = "your-appId"\n$env:ARM_CLIENT_SECRET   = "your-password"\n$env:ARM_TENANT_ID       = "your-tenant"\n$env:ARM_SUBSCRIPTION_ID = "your-sub-id"\n\nLinux / Mac:\nexport ARM_CLIENT_ID="your-appId"\nexport ARM_CLIENT_SECRET="your-password"\nexport ARM_TENANT_ID="your-tenant"\nexport ARM_SUBSCRIPTION_ID="your-sub-id"\n\nNote: these env vars only persist in the current terminal session.` },
      { title:"Create versions.tf and provider.tf", desc:`Create versions.tf with the terraform{} block pinning azurerm ~> 3.85.\n\nCreate provider.tf with the provider "azurerm" block — include the features{} block but add zero credential attributes. They are read from env vars automatically.\n\nNever add client_id, client_secret, tenant_id, or subscription_id as attributes in provider.tf.` },
      { title:"Verify authentication", desc:`Add to main.tf:\ndata "azurerm_subscription" "current" {}\noutput "sub_name" {\n  value = data.azurerm_subscription.current.display_name\n}\n\nRun:\nterraform init\nterraform plan\n\nIf the output shows your Azure subscription display name — authentication is working correctly.` },
      { title:"Inspect .terraform.lock.hcl", desc:`Open .terraform.lock.hcl in your editor. You will see:\n\nprovider "registry.terraform.io/hashicorp/azurerm" {\n  version     = "3.xx.x"\n  constraints = "~> 3.85"\n  hashes = ["h1:...", ...]\n}\n\nThese hashes verify the provider binary has not been tampered with. Commit this file to git so every team member and CI pipeline uses the identical provider version.` },
    ],
  },
  challenge:{
    task:`Create a provider.tf that works for BOTH local development (az login CLI auth) and CI/CD pipelines (service principal env vars) without any file modification between environments. Add a data source that outputs your current client ID and tenant ID, so you can verify which identity Terraform is using.`,
    hints:[
      `The azurerm provider auto-detects auth: ARM_CLIENT_ID + ARM_CLIENT_SECRET + ARM_TENANT_ID set → Service Principal`,
      `If those env vars are absent it falls back to Azure CLI automatically`,
      `data "azurerm_client_config" "current" {} gives you tenant_id, client_id, object_id`,
      `When using SP auth the client_id output will equal your SP appId; when using CLI it will be your user object ID`,
    ],
    solution:`# provider.tf
# Auto-detection order:
# 1. ARM_CLIENT_ID + ARM_CLIENT_SECRET + ARM_TENANT_ID → Service Principal
# 2. ARM_USE_OIDC=true + ARM_CLIENT_ID → Federated/OIDC (GitHub Actions)
# 3. No ARM_* vars → Azure CLI fallback (az login)
# Zero credentials in this file — ever.
provider "azurerm" {
  features {}
}

data "azurerm_client_config" "current" {}

output "authenticated_as" {
  value = "Client: \${data.azurerm_client_config.current.client_id}"
}
output "tenant" {
  value = data.azurerm_client_config.current.tenant_id
}`,
  },
  deepDiveTopics:[
    "Azure Entra ID — tenants, applications, service principals explained",
    "OIDC federated identity — passwordless auth for GitHub Actions and Azure DevOps",
    "Managed Identity vs Service Principal — when to use which",
    ".terraform.lock.hcl — why provider hashes matter for security",
    "ARM_* environment variables — full list and what each one controls",
    "Multiple Azure subscriptions — how to target different subs from one config",
  ],
},
// ─── DAY 3 ───────────────────────────────────────────────────────────────────
{
  id:3, phase:1, type:"theory",
  title:"Variables, Outputs & Locals",
  subtitle:"Input variables, output values, local expressions, .tfvars files",
  theory:{
    intro:`Hardcoded values in Terraform configs make them brittle, non-reusable, and dangerous. Variables, outputs, and locals are the building blocks of flexible parameterised infrastructure. Master these three and you can deploy the same code to dev, staging, and prod by changing a single .tfvars file — no touching resource blocks at all.`,
    concepts:[
      { title:"Input Variables", body:`Variables are the parameters of your config. Define them with variable{} blocks specifying type, optional default, description, and validation rules. If no default is set Terraform prompts at runtime or reads from .tfvars files. Override at runtime with: -var="key=value" flag, -var-file=file.tfvars, or TF_VAR_name environment variables. Variables make your configs reusable across environments and clients.` },
      { title:"Variable Types", body:`string = text. number = integer or float. bool = true/false. list(string) = ordered ["a","b","c"]. map(string) = {key="val"}. set(string) = unique unordered (ideal for for_each). object({}) = structured with named typed fields. The most useful complex type for Azure resource definitions is map(object()) — define multiple similar resources like subnets or NSG rules in a single variable.` },
      { title:"Output Values", body:`Outputs are the return values of your config. They appear in the terminal after apply, are stored in state, and are accessible by other configs via the terraform_remote_state data source. Mark sensitive = true for passwords and connection strings — hides them from terminal output but the value is still stored in state. Child module outputs are accessed as module.module_name.output_name.` },
      { title:"Local Values", body:`Locals are named expressions computed once and reused anywhere in the config. Define in a locals{} block and reference as local.name. Best uses: assembling resource names from multiple variables like local.rg_name = "rg-\${var.project}-\${var.env}", defining a shared tags map used by every resource, and computing conditional values that multiple resources need.` },
      { title:".tfvars Files", body:`Create dev.tfvars, staging.tfvars, prod.tfvars with environment-specific values. Apply with: terraform apply -var-file=dev.tfvars. Files named terraform.tfvars or *.auto.tfvars are loaded automatically without specifying them. Never commit .tfvars files containing secrets to git — add them to .gitignore. Use environment variables or a secrets manager for sensitive values in CI/CD.` },
      { title:"Variable Validation", body:`Add validation{} blocks inside variable{} to reject invalid inputs before Terraform even connects to Azure. The condition uses any expression returning bool. Common uses: restrict environment to specific allowed values, enforce naming character limits, ensure VM SKUs start with Standard_, validate CIDR format with can(cidrhost()). Validation errors appear immediately with your custom error_message.` },
    ],
    code:`# variables.tf
variable "project" {
  type        = string
  description = "Project name used in all resource names"
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

# locals.tf — computed from variables, reused everywhere
locals {
  prefix  = "\${var.project}-\${var.environment}"
  rg_name = "rg-\${local.prefix}"
  # Strip hyphens for storage account (alphanumeric only)
  st_name = substr(replace("st\${var.project}\${var.environment}", "-", ""), 0, 24)
  tags = {
    project     = var.project
    environment = var.environment
    managed_by  = "terraform"
  }
}

# main.tf — zero hardcoded strings
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
output "resource_group_name" { value = azurerm_resource_group.main.name }
output "storage_connection_string" {
  value     = azurerm_storage_account.main.primary_connection_string
  sensitive = true
}

# dev.tfvars
# project     = "learn"
# environment = "dev"
# location    = "East US"`,
    codeExplainer:`local.st_name uses substr(replace(...)) to strip hyphens and limit to 24 chars — required because Azure storage account names must be lowercase alphanumeric only. The conditional account_replication_type = var.environment == "prod" ? "GRS" : "LRS" means prod gets geo-redundant storage while dev gets cheaper locally-redundant. Same code file, different behaviour from a single variable.`,
    warnings:[
      "Variable validation runs before provider connection — fast feedback on typos before any API calls.",
      "sensitive = true hides the output from terminal but the value is stored in terraform.tfstate in plaintext.",
      "locals{} cannot reference a local value defined in the same block — use two separate locals{} blocks if needed.",
      "TF_VAR_ environment variables take lower precedence than -var flags but higher than defaults.",
    ],
  },
  lab:{
    intro:"Refactor the Day 1 config to use proper variables, locals, and outputs. Then deploy it for both dev and prod using separate .tfvars files.",
    steps:[
      { title:"Create 4 separate files", desc:`Split your config into:\n- variables.tf — all variable{} blocks\n- locals.tf — all local{} blocks\n- main.tf — resource and data blocks only\n- outputs.tf — all output{} blocks\n\nThis is the standard file structure for any Terraform config beyond a quick test.` },
      { title:"Define your variables", desc:`Add these variables to variables.tf:\n- project: string, default "learn", validation: lowercase alnum max 10 chars\n- environment: string, default "dev", validation: only dev/staging/prod allowed\n- location: string, default "East US"\n- location_short: string, default "eus"\n\nAdd a description to every variable — treat variables.tf as documentation.` },
      { title:"Build the locals block", desc:`locals {\n  prefix  = "\${var.project}-\${var.environment}"\n  rg_name = "rg-\${local.prefix}-\${var.location_short}"\n  tags = {\n    project     = var.project\n    environment = var.environment\n    managed_by  = "terraform"\n  }\n}\n\nNow every resource name is derived from two variables. Change var.project once and all resource names update automatically.` },
      { title:"Update main.tf to use locals", desc:`Replace all hardcoded strings in main.tf with local references:\n- name = local.rg_name\n- location = var.location\n- tags = local.tags\n\nIf you see a quoted string that is not a resource type or attribute name it should probably be a variable or local.` },
      { title:"Create .tfvars files", desc:`dev.tfvars:\nproject        = "learn"\nenvironment    = "dev"\nlocation       = "East US"\nlocation_short = "eus"\n\nprod.tfvars:\nproject        = "learn"\nenvironment    = "prod"\nlocation       = "West Europe"\nlocation_short = "we"` },
      { title:"Deploy and verify both environments", desc:`terraform apply -var-file=dev.tfvars\n(check RG name in portal: rg-learn-dev-eus)\n\nterraform apply -var-file=prod.tfvars\n(check RG name: rg-learn-prod-we)\n\nBoth RGs exist simultaneously because they have different names from different variable values.\n\nCheck outputs:\nterraform output\nterraform output resource_group_name` },
    ],
  },
  challenge:{
    task:`Add a variable vm_size of type string with default Standard_B2s. Add a validation that ensures it starts with Standard_ to prevent deprecated Basic_ SKUs. Then create a local called effective_vm_size that automatically uses Standard_D2s_v3 in prod but uses var.vm_size in dev — without adding any extra variables.`,
    hints:[
      `Validation condition: can(regex("^Standard_", var.vm_size))`,
      `Create a local: is_prod = var.environment == "prod"`,
      `Then: effective_vm_size = local.is_prod ? "Standard_D2s_v3" : var.vm_size`,
      `Add an output "vm_size_used" showing local.effective_vm_size to verify it works`,
    ],
    solution:`variable "vm_size" {
  type    = string
  default = "Standard_B2s"
  validation {
    condition     = can(regex("^Standard_", var.vm_size))
    error_message = "vm_size must use Standard SKU — must start with Standard_."
  }
}

locals {
  is_prod           = var.environment == "prod"
  effective_vm_size = local.is_prod ? "Standard_D2s_v3" : var.vm_size
}

output "vm_size_used" {
  value = "Deploying with VM size: \${local.effective_vm_size}"
}`,
  },
  deepDiveTopics:[
    "Variable type system — object, tuple, any and type coercion explained",
    "Variable precedence order — which source wins when multiple are set",
    "sensitive variables — how they behave in plans, logs, and state",
    "can() and try() functions — safe validation without crashing",
    "Complex locals — for expressions, flatten(), merge() patterns",
    ".tfvars vs TF_VAR_ environment variables — pros and cons of each",
  ],
},
// ─── DAY 4 ───────────────────────────────────────────────────────────────────
{
  id:4, phase:1, type:"theory",
  title:"State Management & Data Sources",
  subtitle:"terraform.tfstate internals, state commands, importing resources",
  theory:{
    intro:`Terraform state is the single most important thing to understand correctly. It maps your HCL config to real Azure resource IDs. Misunderstanding or mishandling state is the number one source of Terraform disasters in production environments. Today we go deep on what state contains, how to manage it safely, and how to use data sources to reference infrastructure that exists outside your Terraform config.`,
    concepts:[
      { title:"What is Inside terraform.tfstate", body:`State is a JSON file with a resources array. Each entry maps a Terraform address like azurerm_resource_group.main to its real Azure ID like /subscriptions/.../resourceGroups/rg-myapp-dev plus all attribute values. When you run plan Terraform does a three-way diff: HCL config vs state vs live Azure API. Changes made outside Terraform such as portal edits are detected on the next plan run.` },
      { title:"State File Dangers", body:`Never edit terraform.tfstate manually — a syntax error loses track of all resources. Never delete it unless you are intentionally decommissioning everything. If state is lost Terraform thinks all resources are new and apply would create duplicates while leaving orphans. State can contain sensitive data like connection strings and passwords in plaintext — protect it with Azure Blob Storage encryption and strict RBAC access control.` },
      { title:"terraform state Commands", body:`terraform state list — shows all resources Terraform tracks. terraform state show resource.address — shows all attributes of one resource exactly as stored in state. terraform state rm resource.address — removes from state without deleting from Azure, useful when you want Terraform to forget a resource. terraform state mv — renames a resource in state without recreating it. terraform state pull — fetches remote state as JSON.` },
      { title:"terraform import", body:`Brings an existing Azure resource under Terraform management without recreating it. Two steps: add the resource block to your HCL, then run terraform import resource.address azure_resource_id. Terraform populates state for that resource. Then run plan — it should show no changes if your HCL matches reality. Common scenario: taking over resources that someone clicked into existence in the portal.` },
      { title:"Data Sources", body:`data{} blocks read existing resources without creating them. You can look up existing VNets, Key Vaults, resource groups, subscription info, and hundreds more. Reference their attributes exactly like resource attributes: data.azurerm_resource_group.existing.location. Essential for connecting Terraform-managed resources to pre-existing infrastructure that lives outside your state file.` },
      { title:"lifecycle Meta-argument", body:`The lifecycle{} block controls Terraform behaviour for that resource. prevent_destroy = true makes terraform destroy fail for that specific resource — a safety net for production databases. create_before_destroy = true creates a replacement before deleting the old one for zero-downtime updates. ignore_changes = [tags] tells Terraform to ignore changes to specific attributes like tags managed by Azure Policy.` },
    ],
    code:`# data sources — reading EXISTING Azure resources
data "azurerm_resource_group" "existing" {
  name = "rg-existing-prod"
}
data "azurerm_client_config" "current" {}
data "azurerm_key_vault" "shared" {
  name                = "kv-shared-prod"
  resource_group_name = data.azurerm_resource_group.existing.name
}

# Use data source in a new resource
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
    ignore_changes  = [tags]  # Azure Policy manages tags externally
  }
}

# State commands reference (run in terminal):
# terraform state list
# terraform state show azurerm_resource_group.main
# terraform state rm azurerm_resource_group.main
# terraform state mv azurerm_resource_group.main azurerm_resource_group.primary

# Import existing RG (terminal only, not in .tf files):
# terraform import azurerm_resource_group.existing \\
#   /subscriptions/<SUB_ID>/resourceGroups/rg-existing-prod`,
    codeExplainer:`data.azurerm_resource_group.existing.name reads from Azure — useful when the RG was created before Terraform. prevent_destroy = true blocks terraform destroy even if you run it against the whole config — Terraform will error and stop. ignore_changes = [tags] is critical in environments where Azure Policy auto-assigns tags, otherwise every plan shows a perpetual spurious tag diff that you cannot resolve.`,
    warnings:[
      "Local state is for solo development only — use Azure Blob backend for any shared or production configuration.",
      "terraform state rm only removes from state — the Azure resource still exists and incurs charges.",
      "After terraform import always run plan immediately to check your HCL matches reality before making any changes.",
      "Sensitive values in state are stored in plaintext JSON — restrict access to state files like you would a credentials file.",
    ],
  },
  lab:{
    intro:"Explore Terraform state hands-on — inspect the state file, practice state commands, import an existing resource, and use data sources.",
    steps:[
      { title:"Inspect raw state file", desc:`After any terraform apply open terraform.tfstate in your editor.\n\nFind the "resources" array. Each resource entry has:\n- "type": "azurerm_resource_group"\n- "name": "main"\n- "instances": [{ "attributes": { "id": "/subscriptions/...", "name": "rg-...", ... }}]\n\nThe "id" field is the actual Azure ARM resource ID that Terraform uses to manage the resource.` },
      { title:"Run terraform state list", desc:`terraform state list\n\nOutput will show:\nazurerm_resource_group.main\n\nIf you have multiple resources deployed:\nazurerm_resource_group.main\nazurerm_storage_account.main\ndata.azurerm_client_config.current\n\nNote: data sources also appear in state list.` },
      { title:"Run terraform state show", desc:`terraform state show azurerm_resource_group.main\n\nOutput shows every tracked attribute:\nid       = "/subscriptions/.../resourceGroups/rg-learn-dev"\nlocation = "eastus"\nname     = "rg-learn-dev"\ntags     = { environment = "dev", managed_by = "terraform" }\n\nThis is exactly what Terraform compares against when you run plan — useful for debugging unexpected changes.` },
      { title:"Add a data source", desc:`Add to main.tf:\ndata "azurerm_subscription" "current" {}\n\noutput "sub_display_name" {\n  value = data.azurerm_subscription.current.display_name\n}\noutput "sub_id" {\n  value = data.azurerm_subscription.current.id\n}\n\nRun terraform apply — zero new Azure resources created but the outputs appear.` },
      { title:"Test prevent_destroy", desc:`Add to your resource group resource block:\nlifecycle {\n  prevent_destroy = true\n}\n\nRun terraform destroy.\n\nExpected error:\nError: Instance cannot be destroyed\nResource azurerm_resource_group.main has lifecycle.prevent_destroy set.\n\nRemove the lifecycle block and run destroy again — it succeeds.` },
      { title:"Import an existing resource", desc:`In Azure portal manually create a resource group named rg-imported-test.\n\nAdd to main.tf:\nresource "azurerm_resource_group" "imported" {\n  name     = "rg-imported-test"\n  location = "East US"\n}\n\nDo NOT run apply. Instead run:\nterraform import azurerm_resource_group.imported \\\n  /subscriptions/YOUR_SUB_ID/resourceGroups/rg-imported-test\n\nNow run terraform plan — should show no changes if your HCL matches.` },
    ],
  },
  challenge:{
    task:`Write a Terraform config using ONLY data sources — zero resource blocks — that outputs your tenant ID, subscription display name, and the location of a resource group whose name you pass as a variable. Run terraform apply and confirm all three outputs appear with the message "Plan: 0 to add, 0 to change, 0 to destroy."`,
    hints:[
      `data "azurerm_client_config" "current" {} provides tenant_id and client_id`,
      `data "azurerm_subscription" "current" {} provides display_name and id`,
      `data "azurerm_resource_group" "target" { name = var.rg_name } provides location`,
      `terraform plan should show: Plan: 0 to add, 0 to change, 0 to destroy`,
    ],
    solution:`variable "rg_name" {
  type        = string
  description = "Name of an existing resource group to inspect"
}

data "azurerm_client_config"  "current" {}
data "azurerm_subscription"   "current" {}
data "azurerm_resource_group" "target"  { name = var.rg_name }

output "tenant_id"         { value = data.azurerm_client_config.current.tenant_id }
output "subscription_name" { value = data.azurerm_subscription.current.display_name }
output "rg_location"       { value = data.azurerm_resource_group.target.location }`,
  },
  deepDiveTopics:[
    "terraform.tfstate JSON structure — complete breakdown of every field",
    "Remote state backends — Azure Blob vs Terraform Cloud vs S3",
    "State locking — how Azure Blob lease prevents concurrent apply runs",
    "State drift — detecting and reconciling changes made in the portal",
    "Partial state — what happens when apply fails halfway through",
    "terraform moved block — refactoring resources without destroy/recreate",
  ],
},
// ─── DAY 5 ───────────────────────────────────────────────────────────────────
{
  id:5, phase:1, type:"project",
  title:"PROJECT — Azure Baseline Setup",
  subtitle:"Resource Group + Storage Account + Key Vault wired together",
  theory:{
    intro:`Today you build your first complete production-pattern Azure baseline. This is exactly what real Terraform projects start with: a resource group containing a storage account and a Key Vault, all wired together with proper variables, outputs, locals, conditional logic, and Azure CAF naming conventions. By the end you have a reusable pattern you can clone for every client engagement.`,
    concepts:[
      { title:"Project Goal", body:`Build a baseline deployable to any environment. The RG contains: (1) Storage Account — for app data, and later for Terraform remote state itself. (2) Key Vault — for secrets, certificates, and keys. All resource names follow the Azure Cloud Adoption Framework naming convention. The same six files deploy correctly to dev (cheap settings, no purge protection) and prod (GRS storage, purge protection enabled) by changing a single variable.` },
      { title:"Azure Storage Account Naming", body:`The most common Terraform beginner mistake. Rules: 3–24 characters, lowercase alphanumeric ONLY, globally unique across all of Azure. No hyphens, no underscores, no uppercase letters. Use substr(replace("st\${var.project}\${var.environment}", "-", ""), 0, 24) to strip hyphens and enforce the length limit. Add a random suffix from the hashicorp/random provider to guarantee global uniqueness.` },
      { title:"Key Vault Soft Delete Behaviour", body:`Azure Key Vaults have soft delete enabled by default — a deleted KV sits in recoverable state for 7–90 days. During this time you cannot create a new KV with the same name. In dev set purge_protection_enabled = false and add the provider features block to auto-purge on destroy so your iterative development is not blocked. In prod keep purge_protection_enabled = true to prevent accidental data loss.` },
      { title:"Conditional Expressions in Resources", body:`The ternary operator var.environment == "prod" ? "GRS" : "LRS" lets a single resource block behave differently based on environment. Use it for: replication type, VM size, retention days, SKU tier, purge protection. This pattern eliminates the need for separate resource blocks per environment and keeps your codebase DRY.` },
    ],
    code:`# locals.tf
locals {
  prefix  = "\${var.project}-\${var.environment}"
  rg_name = "rg-\${local.prefix}-\${var.location_short}"
  st_name = substr(replace("st\${var.project}\${var.environment}", "-", ""), 0, 20)
  kv_name = "kv-\${local.prefix}-001"
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
    tenant_id          = data.azurerm_client_config.current.tenant_id
    object_id          = data.azurerm_client_config.current.object_id
    secret_permissions = ["Get","List","Set","Delete","Purge","Recover"]
  }
  tags = local.tags
}`,
    codeExplainer:`Three key patterns: (1) Conditional replication type — one ternary handles dev vs prod storage tier. (2) purge_protection_enabled = var.environment == "prod" — same pattern for Key Vault safety. (3) The access_policy uses data.azurerm_client_config.current.object_id which gives Terraform itself permission to create and manage secrets — without this block you cannot write secrets even as the creator.`,
    warnings:[
      "Key Vault name: 3–24 chars, must start with a letter, alphanumeric and hyphens only.",
      "If Key Vault destroy fails with a soft-delete error, add purge_soft_delete_on_destroy=true to the provider features block.",
      "access_policy with your own object_id is required to create Key Vault secrets via Terraform.",
      "min_tls_version = TLS1_2 is an Azure security baseline requirement — include it in every storage account.",
    ],
  },
  lab:{
    intro:"Build and deploy the complete baseline to both dev and prod. Verify the conditional logic produces correctly configured resources for each environment.",
    steps:[
      { title:"Create the full project structure", desc:`New folder: baseline/\n\nCreate these files:\n- versions.tf (terraform + provider declarations with features block)\n- provider.tf (azurerm with key_vault and virtual_machine features)\n- variables.tf (project, environment, location, location_short)\n- locals.tf (prefix, rg_name, st_name, kv_name, tags)\n- main.tf (data source + 3 resources)\n- outputs.tf (6 outputs)\n- dev.tfvars\n- prod.tfvars` },
      { title:"Add all 6 outputs", desc:`output "resource_group_name"   { value = azurerm_resource_group.main.name }\noutput "resource_group_id"     { value = azurerm_resource_group.main.id }\noutput "storage_account_name"  { value = azurerm_storage_account.main.name }\noutput "storage_connection_string" {\n  value     = azurerm_storage_account.main.primary_connection_string\n  sensitive = true\n}\noutput "key_vault_uri" { value = azurerm_key_vault.main.vault_uri }\noutput "key_vault_id"  { value = azurerm_key_vault.main.id }` },
      { title:"Deploy dev environment", desc:`terraform init\nterraform apply -var-file=dev.tfvars\n\nVerify in portal:\n- RG name follows convention (rg-learn-dev-eus)\n- Storage Account has LRS replication\n- Key Vault has purge_protection = Disabled\n\nRun: terraform output\nAll 6 outputs should appear. Connection string shows as (sensitive value).` },
      { title:"Deploy prod environment", desc:`Create prod.tfvars:\nproject = "learn"\nenvironment = "prod"\nlocation = "East US"\nlocation_short = "eus"\n\nterraform apply -var-file=prod.tfvars\n\nVerify in portal:\n- Different RG name (rg-learn-prod-eus)\n- Storage Account has GRS replication\n- Key Vault has purge_protection = Enabled` },
      { title:"Clean destroy of both", desc:`terraform destroy -var-file=prod.tfvars\n\nIf Key Vault destroy fails:\nAdd to provider features:\nkey_vault {\n  purge_soft_delete_on_destroy = true\n}\nThen re-run.\n\nterraform destroy -var-file=dev.tfvars\n\nBoth environments destroyed cleanly.` },
    ],
  },
  challenge:{
    task:`Add the hashicorp/random provider to generate a stable 6-character suffix appended to the storage account name for global uniqueness. The suffix must be stable — it must NOT regenerate on every apply. Use the keeper argument to tie it to the project and environment so it only regenerates if those values change. Output the final storage account name.`,
    hints:[
      `Add random = { source = "hashicorp/random", version = "~> 3.5" } to required_providers`,
      `resource "random_string" "suffix" { length=6, special=false, upper=false }`,
      `keepers = { project = var.project, environment = var.environment } stabilises the value`,
      `local.st_name = "\${substr(replace("st\${var.project}\${var.environment}","-",""),0,18)}\${random_string.suffix.result}"`,
    ],
    solution:`# versions.tf addition
terraform {
  required_providers {
    azurerm = { source = "hashicorp/azurerm", version = "~> 3.85" }
    random  = { source = "hashicorp/random",  version = "~> 3.5"  }
  }
}

resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
  keepers = {
    project     = var.project
    environment = var.environment
  }
}

locals {
  st_name = "\${substr(replace("st\${var.project}\${var.environment}", "-", ""), 0, 18)}\${random_string.suffix.result}"
}

output "storage_account_name" {
  value = azurerm_storage_account.main.name
}`,
  },
  deepDiveTopics:[
    "Azure CAF naming convention — full reference for all resource types",
    "Key Vault access policy vs RBAC — which model to use in 2024",
    "Storage Account security hardening — all flags you should always set",
    "random provider — random_string vs random_id vs random_pet",
    "Terraform project structure at scale — mono-repo vs poly-repo patterns",
    "Cost optimisation — correctly sizing dev vs prod Azure resources",
  ],
},
// ─── DAY 6 ───────────────────────────────────────────────────────────────────
{
  id:6, phase:2, type:"theory",
  title:"Azure VNet, Subnets & CIDR Planning",
  subtitle:"VNet address spaces, subnet design, for_each subnets, service endpoints",
  theory:{
    intro:`Every Azure VM, database, and managed service lives inside a Virtual Network. Getting the network design right in Terraform sets the foundation for everything that follows — security, connectivity, scalability, and cost. A poor CIDR plan is nearly impossible to fix without downtime. A solid one scales for years. Today we design and deploy a production-ready VNet with multiple subnets using for_each.`,
    concepts:[
      { title:"Virtual Network Basics", body:`A VNet is Azure's isolated private network boundary. You define an address space (e.g. 10.0.0.0/16 gives 65,536 IP addresses). Inside the VNet you carve out subnets — each gets a slice of the VNet address space. Resources in the same VNet communicate freely by default using private IPs. Resources in different VNets are isolated unless you configure VNet Peering.` },
      { title:"CIDR Planning for Azure", body:`Use a /16 VNet for production — 65K IPs, plenty of room to grow. Subnets are typically /24 (254 usable hosts) for application tiers. Azure reserves 5 IPs per subnet (network, gateway, broadcast, and two for Azure services) so a /24 gives 251 usable IPs. For Azure Bastion: the subnet MUST be named exactly AzureBastionSubnet and must be /27 or larger. For VPN Gateway: must be named GatewaySubnet.` },
      { title:"Subnet Delegation", body:`Some Azure PaaS services require a dedicated subnet with a delegation block — this tells Azure that subnet is exclusively for that service. Examples include Azure Container Apps, Azure Functions Premium plan, Azure SQL Managed Instance, and Azure Databricks. Use azurerm_subnet with a delegation{} block specifying the service_delegation name and actions.` },
      { title:"Service Endpoints vs Private Endpoints", body:`Service endpoints route subnet traffic to Azure PaaS services like Storage through the Azure backbone — traffic stays on Microsoft's network but the PaaS service still has a public endpoint. Private endpoints give a PaaS service a real private IP inside your VNet and use DNS to resolve the service name to that private IP — more secure and the recommended approach for new deployments.` },
      { title:"for_each for Subnets", body:`Never repeat subnet resource blocks. Define a map(object()) variable with subnet names as keys and CIDR blocks plus service endpoints as values. Then use for_each on a single azurerm_subnet resource. Adding a new subnet becomes a one-line change in your .tfvars file. The output maps subnet names to their IDs — consumed by NSGs, VMs, and databases in downstream resources.` },
    ],
    code:`# variables.tf
variable "vnet_address_space" {
  type    = list(string)
  default = ["10.0.0.0/16"]
}

variable "subnets" {
  type = map(object({
    cidr              = string
    service_endpoints = list(string)
  }))
  default = {
    app  = { cidr = "10.0.1.0/24", service_endpoints = ["Microsoft.Storage"] }
    data = { cidr = "10.0.2.0/24", service_endpoints = ["Microsoft.Sql"] }
    mgmt = { cidr = "10.0.3.0/24", service_endpoints = [] }
    AzureBastionSubnet = { cidr = "10.0.4.0/27", service_endpoints = [] }
  }
}

# main.tf
resource "azurerm_virtual_network" "main" {
  name                = "vnet-\${local.prefix}"
  address_space       = var.vnet_address_space
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tags                = local.tags
}

resource "azurerm_subnet" "subnets" {
  for_each             = var.subnets
  name                 = each.key
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = [each.value.cidr]
  service_endpoints    = each.value.service_endpoints
}

# outputs.tf — expose subnet IDs for downstream resources
output "subnet_ids" {
  value = { for k, v in azurerm_subnet.subnets : k => v.id }
}
output "vnet_id" {
  value = azurerm_virtual_network.main.id
}`,
    codeExplainer:`for_each = var.subnets iterates over the map — each.key is the subnet name (app, data, mgmt), each.value.cidr is the address prefix. The output block uses a for expression to build a map of subnet_name => subnet_id. Downstream resources like NSGs and VMs reference output.subnet_ids["app"] to place themselves in the correct subnet without needing to know the actual CIDR or ID.`,
    warnings:[
      "AzureBastionSubnet must be exactly that name — case sensitive — or Bastion deployment will fail.",
      "GatewaySubnet must also be exact — and do not add NSGs to it or VPN Gateway will fail.",
      "You cannot resize a subnet that contains resources — plan your CIDR ranges with room to grow.",
      "Azure reserves 5 IPs per subnet: .0 (network), .1 (default gateway), .2-.3 (Azure DNS), .255 (broadcast).",
    ],
  },
  lab:{
    intro:"Build a full VNet with four subnets including AzureBastionSubnet, with proper CIDR allocation and service endpoints configured.",
    steps:[
      { title:"Plan your CIDR before coding", desc:`Write these down before touching Terraform:\nVNet: 10.0.0.0/16\napp subnet: 10.0.1.0/24 (251 usable IPs)\ndata subnet: 10.0.2.0/24 (251 usable IPs)\nmgmt subnet: 10.0.3.0/24 (251 usable IPs)\nAzureBastionSubnet: 10.0.4.0/27 (27 usable IPs)\n\nVisualising the network before coding prevents CIDR overlap mistakes.` },
      { title:"Define the subnets variable", desc:`Add the map(object()) variable to variables.tf as shown in the code example. This keeps all subnet definitions together in one place and makes adding a new subnet a single-line change.` },
      { title:"Create VNet and subnets with for_each", desc:`Write the azurerm_virtual_network resource and the azurerm_subnet resource with for_each = var.subnets.\n\nRun:\nterraform plan\n\nExpected: 1 VNet + 4 subnet resources to add. Verify the names and CIDRs match your plan.` },
      { title:"Apply and verify in portal", desc:`terraform apply\n\nOpen Azure portal → your resource group → Virtual Networks → your VNet → Subnets tab.\n\nVerify:\n- All 4 subnets appear with correct CIDRs\n- AzureBastionSubnet shows as /27\n- app and data subnets show their service endpoints` },
      { title:"Inspect the subnet_ids output", desc:`terraform output subnet_ids\n\nYou should see a map like:\n{\n  "AzureBastionSubnet" = "/subscriptions/.../subnets/AzureBastionSubnet"\n  "app"  = "/subscriptions/.../subnets/app"\n  "data" = "/subscriptions/.../subnets/data"\n  "mgmt" = "/subscriptions/.../subnets/mgmt"\n}\n\nThis output will be consumed by NSG resources in tomorrow's lab.` },
    ],
  },
  challenge:{
    task:`Add a 5th subnet called AzureFirewallSubnet with CIDR 10.0.5.0/26 (Azure Firewall requires minimum /26). But create this subnet ONLY when a variable deploy_firewall is set to true. When false the subnet must not exist — not just empty, actually absent from the plan.`,
    hints:[
      `You cannot use count directly on a for_each resource — use a local to conditionally add to the map instead`,
      `locals { firewall_subnet = var.deploy_firewall ? { AzureFirewallSubnet = {cidr="10.0.5.0/26", service_endpoints=[]} } : {} }`,
      `Then: for_each = merge(var.subnets, local.firewall_subnet)`,
      `Test with deploy_firewall=false then true — the plan should show 0 or 1 subnet to add/destroy`,
    ],
    solution:`variable "deploy_firewall" {
  type    = bool
  default = false
}

locals {
  firewall_subnet = var.deploy_firewall ? {
    AzureFirewallSubnet = { cidr = "10.0.5.0/26", service_endpoints = [] }
  } : {}
  all_subnets = merge(var.subnets, local.firewall_subnet)
}

resource "azurerm_subnet" "subnets" {
  for_each             = local.all_subnets
  name                 = each.key
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = [each.value.cidr]
  service_endpoints    = each.value.service_endpoints
}`,
  },
  deepDiveTopics:[
    "Hub-spoke network topology — design and Terraform implementation",
    "VNet Peering — azurerm_virtual_network_peering and routing",
    "Private endpoints — DNS configuration and azurerm_private_endpoint",
    "Azure Firewall vs NSGs vs Application Gateway — when to use each",
    "IP address management — avoiding CIDR conflicts across VNets",
    "Service endpoint policies — restricting storage access to specific accounts",
  ],
},
// ─── DAY 7 ───────────────────────────────────────────────────────────────────
{
  id:7, phase:2, type:"theory",
  title:"NSGs & Security Rules",
  subtitle:"NSG rules, service tags, subnet associations, rule management patterns",
  theory:{
    intro:`Network Security Groups are Azure's stateful packet filter — they control which traffic can reach your subnets and NICs. In Terraform you define them declaratively, associate them with subnets in code, and get a full audit trail of every rule change through git history. NSGs are the primary network security control in Azure and understanding them deeply is essential for any Azure infrastructure work.`,
    concepts:[
      { title:"NSG Rule Anatomy", body:`Every rule has six required fields: name, priority (100–4096, lower = higher precedence), direction (Inbound or Outbound), access (Allow or Deny), protocol (Tcp, Udp, Icmp, or *), source_port_range, destination_port_range, source_address_prefix, and destination_address_prefix. Source and destination can be a CIDR, a service tag, an asterisk for any, or an Application Security Group ID.` },
      { title:"Default Rules You Cannot Delete", body:`Every NSG gets three inbound defaults: AllowVnetInBound (65000), AllowAzureLoadBalancerInBound (65001), DenyAllInBound (65500). And three outbound defaults: AllowVnetOutBound (65000), AllowInternetOutBound (65001), DenyAllOutBound (65500). You cannot delete these but you can override them by creating rules with lower priority numbers. The DenyAll at 65500 means everything not explicitly allowed is blocked.` },
      { title:"Service Tags", body:`Instead of hardcoding IP ranges use Service Tags — Microsoft-managed named groups of IP ranges that update automatically. Key tags: Internet (all public IPs), VirtualNetwork (your VNet + peered VNets + on-premises), AzureLoadBalancer (health probe IPs), Storage (all Azure Storage IPs), Sql (Azure SQL IPs), AzureActiveDirectory, AzureMonitor, AppService. Service tags prevent you from ever needing to update IP ranges manually.` },
      { title:"Inline Rules vs Separate Resources", body:`You can define security_rule{} blocks inline inside azurerm_network_security_group OR use separate azurerm_network_security_rule resources. Separate resources are strongly recommended: they allow independent management of individual rules, prevent state conflicts when multiple engineers add rules simultaneously, and make terraform plan output cleaner when only one rule changes out of twenty.` },
      { title:"NSG Association", body:`An NSG exists independently of subnets and NICs. Association is done through separate resources: azurerm_subnet_network_security_group_association links an NSG to a subnet and controls all traffic into and out of that subnet. azurerm_network_interface_security_group_association links an NSG to a specific VM NIC for per-VM control. Subnet-level is simpler and more manageable for most scenarios.` },
    ],
    code:`# Create the NSG
resource "azurerm_network_security_group" "app" {
  name                = "nsg-app-\${local.prefix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tags                = local.tags
}

# Separate rule resources — preferred over inline blocks
resource "azurerm_network_security_rule" "allow_http" {
  name                        = "Allow-HTTP-Inbound"
  priority                    = 100
  direction                   = "Inbound"
  access                      = "Allow"
  protocol                    = "Tcp"
  source_port_range           = "*"
  destination_port_range      = "80"
  source_address_prefix       = "Internet"
  destination_address_prefix  = "10.0.1.0/24"
  resource_group_name         = azurerm_resource_group.main.name
  network_security_group_name = azurerm_network_security_group.app.name
}

resource "azurerm_network_security_rule" "allow_https" {
  name                        = "Allow-HTTPS-Inbound"
  priority                    = 110
  direction                   = "Inbound"
  access                      = "Allow"
  protocol                    = "Tcp"
  source_port_range           = "*"
  destination_port_range      = "443"
  source_address_prefix       = "Internet"
  destination_address_prefix  = "10.0.1.0/24"
  resource_group_name         = azurerm_resource_group.main.name
  network_security_group_name = azurerm_network_security_group.app.name
}

resource "azurerm_network_security_rule" "deny_rdp_internet" {
  name                        = "Deny-RDP-Internet"
  priority                    = 200
  direction                   = "Inbound"
  access                      = "Deny"
  protocol                    = "Tcp"
  source_port_range           = "*"
  destination_port_range      = "3389"
  source_address_prefix       = "Internet"
  destination_address_prefix  = "*"
  resource_group_name         = azurerm_resource_group.main.name
  network_security_group_name = azurerm_network_security_group.app.name
}

# Associate NSG with subnet
resource "azurerm_subnet_network_security_group_association" "app" {
  subnet_id                 = azurerm_subnet.subnets["app"].id
  network_security_group_id = azurerm_network_security_group.app.id
}`,
    codeExplainer:`Priority 100 allows HTTP before priority 200 denies RDP — both evaluated before the default DenyAll at 65500. The Internet service tag covers all public IPs so you do not need to hardcode or maintain IP ranges. The association resource is the glue — the NSG exists as a standalone object until associated. Referencing azurerm_subnet.subnets["app"].id uses the for_each output from Day 6.`,
    warnings:[
      "NSG rules are stateful — if you allow inbound port 80, the return traffic is automatically allowed outbound.",
      "Never allow RDP (3389) or SSH (22) from Internet (0.0.0.0/0) — use Azure Bastion or restrict to your IP only.",
      "Mixing inline security_rule{} blocks and separate azurerm_network_security_rule resources causes Terraform conflicts.",
      "Effective security rules on a NIC are the combined result of both the subnet NSG and the NIC NSG — check both when debugging.",
    ],
  },
  lab:{
    intro:"Create NSGs for app, data, and mgmt subnets with appropriate security rules for each tier, using the Day 6 VNet as the foundation.",
    steps:[
      { title:"Design rules before coding", desc:`App subnet rules:\n- Allow 80/443 inbound from Internet (web tier)\n- Allow 3389 inbound from mgmt subnet only\n- Deny 3389 from Internet\n\nData subnet rules:\n- Allow 1433 (SQL) inbound from app subnet only\n- Deny all inbound from Internet\n\nMgmt subnet rules:\n- Allow 3389 inbound from your admin IP only\n\nWrite this out before touching Terraform — it prevents logic errors.` },
      { title:"Create NSGs with for_each", desc:`Define a set variable: nsg_names = ["app","data","mgmt"]\n\nCreate NSGs:\nresource "azurerm_network_security_group" "nsg" {\n  for_each            = toset(["app","data","mgmt"])\n  name                = "nsg-\${each.key}-\${local.prefix}"\n  location            = azurerm_resource_group.main.location\n  resource_group_name = azurerm_resource_group.main.name\n  tags                = local.tags\n}` },
      { title:"Add rules as separate resources", desc:`Create separate azurerm_network_security_rule resources for each rule. Reference the correct NSG:\n\nnetwork_security_group_name = azurerm_network_security_group.nsg["app"].name\n\nUse a variable for your admin IP:\nvariable "admin_ip_cidr" {\n  type    = string\n  default = "YOUR_IP/32"\n}` },
      { title:"Associate all three NSGs", desc:`resource "azurerm_subnet_network_security_group_association" "nsg" {\n  for_each = toset(["app","data","mgmt"])\n  subnet_id = azurerm_subnet.subnets[each.key].id\n  network_security_group_id = azurerm_network_security_group.nsg[each.key].id\n}\n\nterraform apply and verify each subnet shows its NSG in the portal.` },
      { title:"Verify effective security rules", desc:`In Azure portal:\n- Navigate to any VM NIC → Effective security rules\n- This shows the merged ruleset from both subnet NSG and NIC NSG\n- Useful for debugging unexpected allow/deny behaviour\n\nAlternatively check via CLI:\naz network nic show-effective-nsg --name nic-name --resource-group rg-name` },
    ],
  },
  challenge:{
    task:`Instead of creating individual azurerm_network_security_rule resources one by one, define ALL rules as a list(object) variable and use for_each to create them all dynamically from that single variable. The variable should contain at minimum 5 rules covering HTTP, HTTPS, SQL, SSH, and a deny-all-inbound-internet rule.`,
    hints:[
      `Define: variable "nsg_rules" { type = list(object({ name=string, priority=number, direction=string, access=string, protocol=string, source_address_prefix=string, destination_port_range=string, destination_address_prefix=string })) }`,
      `Convert list to map for for_each: for_each = { for r in var.nsg_rules : r.name => r }`,
      `Inside the resource: priority = each.value.priority, access = each.value.access, etc.`,
      `Test that adding a 6th rule in the variable creates exactly one new resource in the plan`,
    ],
    solution:`variable "nsg_app_rules" {
  type = list(object({
    name                       = string
    priority                   = number
    direction                  = string
    access                     = string
    protocol                   = string
    source_address_prefix      = string
    destination_port_range     = string
    destination_address_prefix = string
  }))
  default = [
    { name="Allow-HTTP",  priority=100, direction="Inbound", access="Allow", protocol="Tcp", source_address_prefix="Internet",    destination_port_range="80",   destination_address_prefix="*" },
    { name="Allow-HTTPS", priority=110, direction="Inbound", access="Allow", protocol="Tcp", source_address_prefix="Internet",    destination_port_range="443",  destination_address_prefix="*" },
    { name="Allow-SQL",   priority=120, direction="Inbound", access="Allow", protocol="Tcp", source_address_prefix="10.0.1.0/24", destination_port_range="1433", destination_address_prefix="*" },
    { name="Allow-SSH-mgmt", priority=130, direction="Inbound", access="Allow", protocol="Tcp", source_address_prefix="10.0.3.0/24", destination_port_range="22", destination_address_prefix="*" },
    { name="Deny-Internet", priority=4000, direction="Inbound", access="Deny", protocol="*", source_address_prefix="Internet", destination_port_range="*", destination_address_prefix="*" },
  ]
}

resource "azurerm_network_security_rule" "app" {
  for_each                    = { for r in var.nsg_app_rules : r.name => r }
  name                        = each.value.name
  priority                    = each.value.priority
  direction                   = each.value.direction
  access                      = each.value.access
  protocol                    = each.value.protocol
  source_port_range           = "*"
  destination_port_range      = each.value.destination_port_range
  source_address_prefix       = each.value.source_address_prefix
  destination_address_prefix  = each.value.destination_address_prefix
  resource_group_name         = azurerm_resource_group.main.name
  network_security_group_name = azurerm_network_security_group.nsg["app"].name
}`,
  },
  deepDiveTopics:[
    "Application Security Groups — grouping VMs instead of using IP ranges",
    "Effective security rules — how subnet NSG and NIC NSG are merged",
    "Azure Network Watcher — IP flow verify and connection troubleshoot",
    "Default deny philosophy — building zero-trust network rules",
    "NSG flow logs — enabling and shipping to Log Analytics",
    "Just-in-time VM access — Azure Defender alternative to open RDP",
  ],
},
// ─── DAY 8 ───────────────────────────────────────────────────────────────────
{
  id:8, phase:2, type:"theory",
  title:"Public IPs, NICs & Virtual Machines",
  subtitle:"VM resource chain, SSH auth, OS disk, cloud-init bootstrap",
  theory:{
    intro:`Virtual Machines are the workhorse of Azure IaaS. In Terraform a VM is not a single resource — it is a chain of linked resources: an optional public IP, a network interface, and the VM itself. Understanding how these reference each other and how Terraform resolves the dependency order is the key to deploying VMs reliably and securely.`,
    concepts:[
      { title:"The VM Resource Chain", body:`A VM in Terraform requires: azurerm_public_ip (optional, creates a public IP address) → azurerm_network_interface (the virtual NIC, references the subnet and optionally the public IP) → azurerm_linux_virtual_machine or azurerm_windows_virtual_machine (references the NIC by ID). Terraform sees the attribute references and automatically creates resources in the correct order — no explicit depends_on needed for this pattern.` },
      { title:"VM Authentication", body:`Linux VMs: always use SSH public key authentication — never password auth in production. Add an admin_ssh_key block with username and public_key = file("~/.ssh/id_rsa.pub"). Windows VMs: admin_username + admin_password. Store the password in Key Vault and reference it via a data source — never hardcode passwords in .tf files or .tfvars committed to git.` },
      { title:"OS Disk and Data Disks", body:`Every VM has an OS disk defined inline in the os_disk{} block within the VM resource. Caching: ReadWrite for Windows OS disks, ReadOnly for Linux data disks (faster reads). Storage type: Standard_LRS for dev/test, Premium_SSD (Premium_LRS) for production. Additional data disks use azurerm_managed_disk + azurerm_virtual_machine_data_disk_attachment as separate resources.` },
      { title:"VM Sizes", body:`Standard_B2s (2 vCPU, 4GB RAM) is the cheapest option for dev and testing. Standard_D2s_v3 (2 vCPU, 8GB RAM) for light production workloads. Always use v3 or newer series — v1/v2 are deprecated. The s in Bxs and Dxs_v3 indicates Premium SSD support. Check current pricing at azure.microsoft.com/pricing/details/virtual-machines.` },
      { title:"Cloud-init / Custom Data", body:`The custom_data attribute on Linux VMs accepts a base64-encoded cloud-init script that runs on the first boot. Use base64encode(file("cloud-init.yaml")) to load a YAML file or base64encode("#!/bin/bash\napt install nginx") for inline content. Cloud-init runs as root during provisioning — perfect for installing software, writing config files, and joining domains. Check /var/log/cloud-init-output.log to debug.` },
    ],
    code:`# Public IP — static allocation, Standard SKU
resource "azurerm_public_ip" "vm" {
  name                = "pip-vm-\${local.prefix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  allocation_method   = "Static"
  sku                 = "Standard"
  tags                = local.tags
}

# Network Interface
resource "azurerm_network_interface" "vm" {
  name                = "nic-vm-\${local.prefix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.subnets["app"].id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.vm.id
  }
}

# Linux Virtual Machine
resource "azurerm_linux_virtual_machine" "main" {
  name                = "vm-\${local.prefix}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  size                = var.vm_size
  admin_username      = "azureadmin"
  network_interface_ids = [azurerm_network_interface.vm.id]

  admin_ssh_key {
    username   = "azureadmin"
    public_key = file("~/.ssh/id_rsa.pub")
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts-gen2"
    version   = "latest"
  }

  # Install nginx on first boot via cloud-init
  custom_data = base64encode(<<-EOF
    #!/bin/bash
    apt-get update -y
    apt-get install -y nginx
    systemctl enable nginx
    systemctl start nginx
  EOF
  )
  tags = local.tags
}`,
    codeExplainer:`The chain flows: subnet → NIC (with subnet_id and public_ip_address_id) → VM (with network_interface_ids). Terraform resolves these attribute references into a directed acyclic graph and creates in the right order automatically. The custom_data heredoc installs nginx at first boot — verify it worked by visiting the public IP in a browser. Always use Standard SKU public IPs — Basic SKU is being retired.`,
    warnings:[
      "Basic SKU public IPs are being retired by Azure in 2025 — always use Standard SKU.",
      "Generate your SSH key pair before apply: ssh-keygen -t rsa -b 4096 -f ~/.ssh/terraform_azure_key",
      "Never commit your private key to git — add ~/.ssh/ patterns to .gitignore.",
      "cloud-init can take 2–5 minutes after the VM shows Running in the portal — be patient before testing.",
    ],
  },
  lab:{
    intro:"Deploy a Linux VM in the app subnet from Day 6, with SSH key authentication and nginx bootstrapped via cloud-init.",
    steps:[
      { title:"Generate SSH key pair", desc:`ssh-keygen -t rsa -b 4096 -f ~/.ssh/terraform_azure_key\n\nThis creates:\n- ~/.ssh/terraform_azure_key (private key — never share)\n- ~/.ssh/terraform_azure_key.pub (public key — goes in Terraform)\n\nUpdate the admin_ssh_key block to reference this key:\npublic_key = file("~/.ssh/terraform_azure_key.pub")` },
      { title:"Add VM variables", desc:`Add to variables.tf:\nvariable "vm_size" {\n  type    = string\n  default = "Standard_B2s"\n}\nvariable "admin_username" {\n  type    = string\n  default = "azureadmin"\n}` },
      { title:"Create the resource chain", desc:`Create three resources in main.tf:\n1. azurerm_public_ip.vm (Static, Standard SKU)\n2. azurerm_network_interface.vm (referencing pip and app subnet)\n3. azurerm_linux_virtual_machine.main (referencing the NIC)\n\nterraform plan should show 3 resources to create plus the VNet/subnets from Day 6.` },
      { title:"Apply and SSH in", desc:`terraform apply\n\nGet the public IP:\nterraform output vm_public_ip\n\nSSH into the VM:\nssh -i ~/.ssh/terraform_azure_key azureadmin@PUBLIC_IP\n\nIf NSG blocks port 22 add a temporary inbound rule allowing TCP 22 from your IP.` },
      { title:"Verify nginx installed", desc:`From your browser visit: http://PUBLIC_IP\n\nYou should see the nginx default welcome page.\n\nTo check cloud-init logs on the VM:\ncat /var/log/cloud-init-output.log\n\nThis confirms cloud-init ran successfully at first boot.` },
      { title:"Add outputs", desc:`output "vm_public_ip"  { value = azurerm_public_ip.vm.ip_address }\noutput "vm_private_ip" { value = azurerm_network_interface.vm.private_ip_address }\noutput "vm_id"         { value = azurerm_linux_virtual_machine.main.id }` },
    ],
  },
  challenge:{
    task:`Remove the public IP from the VM — it should only be accessible via Azure Bastion. Create an azurerm_bastion_host resource in the AzureBastionSubnet. Give it its own dedicated Standard SKU static public IP. Output the Bastion resource name so users know where to connect from. The VM NIC should have NO public IP association.`,
    hints:[
      `Remove azurerm_public_ip.vm and remove public_ip_address_id from the NIC ip_configuration`,
      `Create azurerm_public_ip.bastion (Standard SKU, Static allocation)`,
      `resource "azurerm_bastion_host" — reference the AzureBastionSubnet ID and the bastion public IP`,
      `azurerm_bastion_host requires the subnet ID from azurerm_subnet.subnets["AzureBastionSubnet"].id`,
    ],
    solution:`resource "azurerm_public_ip" "bastion" {
  name                = "pip-bastion-\${local.prefix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  allocation_method   = "Static"
  sku                 = "Standard"
}

resource "azurerm_bastion_host" "main" {
  name                = "bastion-\${local.prefix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  ip_configuration {
    name                 = "configuration"
    subnet_id            = azurerm_subnet.subnets["AzureBastionSubnet"].id
    public_ip_address_id = azurerm_public_ip.bastion.id
  }
}

output "bastion_name" { value = azurerm_bastion_host.main.name }`,
  },
  deepDiveTopics:[
    "Accelerated networking — when and how to enable for production VMs",
    "Managed Identity for VMs — accessing Azure services without credentials",
    "Azure VM extensions — custom script, monitoring agent, domain join",
    "Spot VMs — cost savings and eviction handling in Terraform",
    "Windows VMs — WinRM configuration and PowerShell remote access",
    "VM image versions — using azurerm_platform_image data source",
  ],
},
// ─── DAY 9 ───────────────────────────────────────────────────────────────────
{
  id:9, phase:2, type:"theory",
  title:"Azure Load Balancer",
  subtitle:"Standard LB, backend pools, health probes, NAT rules, SKU differences",
  theory:{
    intro:`A Load Balancer distributes incoming traffic across multiple backend VMs for availability and scale. In Azure there are two types: the public Load Balancer (internet-facing) and the internal Load Balancer (VNet-internal). In Terraform an Azure LB is composed of several linked resources — the LB itself, a backend address pool, a health probe, and load balancing rules. Understanding each component and how they connect is the foundation of highly available Azure architectures.`,
    concepts:[
      { title:"Standard vs Basic LB SKU", body:`Always use Standard SKU for any new deployment. Basic SKU is free but being retired, has no SLA, no availability zones support, and no cross-zone load balancing. Standard SKU supports availability zones, has a 99.99% SLA, supports up to 1000 backend instances, and works with VM Scale Sets. The SKU of the Load Balancer must match the SKU of its frontend public IP addresses.` },
      { title:"LB Component Chain", body:`azurerm_lb (the load balancer itself with a frontend IP configuration) → azurerm_lb_backend_address_pool (the group of VMs to distribute to) → azurerm_lb_probe (health check that determines which backends are healthy) → azurerm_lb_rule (the actual load balancing rule connecting frontend port to backend pool via the probe) → azurerm_network_interface_backend_address_pool_association (links each VM NIC to the backend pool).` },
      { title:"Health Probes", body:`Health probes check backend VM health at regular intervals. Protocol options: Http (checks a specific path), Https (checks with TLS), or Tcp (just checks if the port is open). If a VM fails the probe it is removed from rotation until it passes again. Set interval_in_seconds to 5 for fast failure detection, number_of_probes to 2 so one blip does not remove a healthy VM. Http probes checking /health are the most reliable pattern.` },
      { title:"Load Balancing Rules", body:`An LB rule connects a frontend IP + port to the backend pool + backend port through a health probe. frontend_port and backend_port can differ. protocol is Tcp or Udp. enable_floating_ip is for SQL AlwaysOn clusters. load_distribution controls session persistence: Default (5-tuple hash, most common), SourceIP (source IP affinity, for stateful apps), SourceIPProtocol (source IP + protocol affinity).` },
      { title:"Inbound NAT Rules", body:`NAT rules forward specific frontend ports directly to a specific backend VM — bypassing the load balancing pool. Common use: giving each backend VM a unique SSH or RDP port on the frontend IP. For example frontend port 50001 → VM1 port 22, frontend port 50002 → VM2 port 22. This lets you SSH to individual VMs behind the LB without a Bastion host.` },
    ],
    code:`resource "azurerm_public_ip" "lb" {
  name                = "pip-lb-\${local.prefix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  allocation_method   = "Static"
  sku                 = "Standard"
}

resource "azurerm_lb" "main" {
  name                = "lb-\${local.prefix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "Standard"
  frontend_ip_configuration {
    name                 = "frontend"
    public_ip_address_id = azurerm_public_ip.lb.id
  }
}

resource "azurerm_lb_backend_address_pool" "main" {
  name            = "backend-pool"
  loadbalancer_id = azurerm_lb.main.id
}

resource "azurerm_lb_probe" "http" {
  name                = "http-probe"
  loadbalancer_id     = azurerm_lb.main.id
  protocol            = "Http"
  port                = 80
  request_path        = "/health"
  interval_in_seconds = 5
  number_of_probes    = 2
}

resource "azurerm_lb_rule" "http" {
  name                           = "http-rule"
  loadbalancer_id                = azurerm_lb.main.id
  protocol                       = "Tcp"
  frontend_port                  = 80
  backend_port                   = 80
  frontend_ip_configuration_name = "frontend"
  backend_address_pool_ids       = [azurerm_lb_backend_address_pool.main.id]
  probe_id                       = azurerm_lb_probe.http.id
  load_distribution              = "Default"
}

# Link VM NICs to the backend pool
resource "azurerm_network_interface_backend_address_pool_association" "vm" {
  for_each                = { for k, v in azurerm_network_interface.vms : k => v }
  network_interface_id    = each.value.id
  ip_configuration_name   = "internal"
  backend_address_pool_id = azurerm_lb_backend_address_pool.main.id
}`,
    codeExplainer:`The chain: LB with frontend IP → backend pool → health probe → LB rule connecting all three. The NIC association is the final link that places a specific VM NIC into the backend pool. Without the NIC association the backend pool exists but is empty and the LB has nothing to forward to. For each azurerm_network_interface.vms iterates over multiple VM NICs to add them all to the pool.`,
    warnings:[
      "LB SKU and public IP SKU must match — Standard LB requires Standard public IP, Basic LB requires Basic.",
      "Standard LB requires NSG rules to allow traffic — it does not implicitly allow health probe traffic.",
      "Add an NSG rule allowing source AzureLoadBalancer to destination * on the health probe port.",
      "Backend VMs must be in the same VNet as the LB — cross-VNet backend pools require Global LB.",
    ],
  },
  lab:{
    intro:"Deploy a Standard Load Balancer in front of two VMs from Day 8, with an HTTP health probe and load balancing rule.",
    steps:[
      { title:"Deploy two VMs", desc:`Modify your Day 8 VM resource to use count = 2 or for_each with two names.\n\nUpdate the NIC resource similarly — each VM needs its own NIC.\n\nName them: vm-\${local.prefix}-1 and vm-\${local.prefix}-2\n\nBoth VMs should install nginx via cloud-init so the health probe has something to check.` },
      { title:"Create the LB and its components", desc:`Create in order:\n1. azurerm_public_ip.lb (Standard, Static)\n2. azurerm_lb.main (Standard SKU, frontend references the pip)\n3. azurerm_lb_backend_address_pool.main\n4. azurerm_lb_probe.http (Http, port 80, /health)\n5. azurerm_lb_rule.http (frontend 80 → backend 80)\n6. azurerm_network_interface_backend_address_pool_association for each VM NIC` },
      { title:"Add NSG rule for health probes", desc:`Standard LB health probes come from the AzureLoadBalancer service tag. Add an NSG rule to the app subnet NSG:\n\nname      = "Allow-LB-Probe"\npriority  = 150\naccess    = "Allow"\nprotocol  = "Tcp"\nsource    = "AzureLoadBalancer"\ndest_port = "80"\n\nWithout this rule the probes fail and all backends appear unhealthy.` },
      { title:"Test load distribution", desc:`terraform output lb_public_ip\n\nOpen http://LB_PUBLIC_IP in a browser — nginx welcome page should appear.\n\nTo verify load distribution is working:\ncurl -s http://LB_PUBLIC_IP for VM1 hostname\ncurl -s http://LB_PUBLIC_IP for VM2 hostname\n\nWith Default distribution you may hit the same VM repeatedly — use SourceIP to test round-robin.` },
    ],
  },
  challenge:{
    task:`Add inbound NAT rules to the load balancer so you can SSH to each backend VM directly using the LB public IP but on different ports. VM1 should be reachable on port 50001, VM2 on port 50002 — both forwarded to port 22 on the respective VM. Test by SSHing to the LB IP on each port.`,
    hints:[
      `Use azurerm_lb_nat_rule for each VM — one resource per VM`,
      `frontend_port = 50001, backend_port = 22, protocol = "Tcp"`,
      `Associate each NAT rule to a specific VM NIC using azurerm_network_interface_nat_rule_association`,
      `Also add an NSG rule allowing TCP 50001-50002 inbound from your IP`,
    ],
    solution:`resource "azurerm_lb_nat_rule" "ssh" {
  for_each                       = { "1" = 50001, "2" = 50002 }
  name                           = "ssh-vm-\${each.key}"
  resource_group_name            = azurerm_resource_group.main.name
  loadbalancer_id                = azurerm_lb.main.id
  protocol                       = "Tcp"
  frontend_port                  = each.value
  backend_port                   = 22
  frontend_ip_configuration_name = "frontend"
}

resource "azurerm_network_interface_nat_rule_association" "ssh" {
  for_each              = { "1" = azurerm_network_interface.vms["vm1"].id, "2" = azurerm_network_interface.vms["vm2"].id }
  network_interface_id  = each.value
  ip_configuration_name = "internal"
  nat_rule_id           = azurerm_lb_nat_rule.ssh[each.key].id
}`,
  },
  deepDiveTopics:[
    "Application Gateway vs Load Balancer — Layer 7 vs Layer 4 differences",
    "Internal Load Balancer — private frontend IP for internal services",
    "Outbound rules — controlling SNAT port exhaustion with Standard LB",
    "Cross-zone Load Balancer — zone-redundant vs zonal configurations",
    "Azure Traffic Manager — DNS-based global load balancing",
    "Azure Front Door — global HTTP load balancing with WAF",
  ],
},
// ─── DAY 10 ──────────────────────────────────────────────────────────────────
{
  id:10, phase:2, type:"project",
  title:"PROJECT — Hub-Spoke Network + VMs",
  subtitle:"VNet peering, hub-spoke topology, Bastion in hub, VMs in spoke",
  theory:{
    intro:`The hub-spoke network topology is the most widely used enterprise Azure network pattern. A central hub VNet hosts shared services — Bastion, Firewall, VPN Gateway. Spoke VNets host workloads — web tiers, app tiers, databases. Spokes connect to the hub via VNet peering and use the hub's shared services. This pattern gives you centralised security control with workload isolation. Today you build a real hub-spoke deployment in Terraform.`,
    concepts:[
      { title:"Hub-Spoke Design", body:`Hub VNet (e.g. 10.0.0.0/16): contains AzureBastionSubnet, GatewaySubnet, AzureFirewallSubnet. Spoke VNet (e.g. 10.1.0.0/16): contains workload subnets — app, data, mgmt. Peering connects hub ↔ spoke bidirectionally. Spoke VMs use Bastion in the hub for secure access without public IPs. All internet egress can be routed through Azure Firewall in the hub.` },
      { title:"VNet Peering", body:`azurerm_virtual_network_peering must be created in BOTH directions — one resource from hub to spoke, another from spoke to hub. Key settings: allow_virtual_network_access = true (VMs can communicate), allow_forwarded_traffic = true (enables transit through the hub firewall), allow_gateway_transit = true on the hub side, use_remote_gateways = true on the spoke side (uses hub's VPN gateway).` },
      { title:"Route Tables", body:`By default Azure routes traffic locally within a VNet and directly to the internet. To force all internet traffic through the hub Firewall you need a Route Table (UDR). Create azurerm_route_table with a route to 0.0.0.0/0 pointing to the Firewall private IP as next_hop_type = "VirtualAppliance". Associate the route table with spoke subnets via azurerm_subnet_route_table_association.` },
      { title:"Peering Limitations", body:`VNet Peering is not transitive — if SpokeA and SpokeB both peer with Hub, SpokeA cannot reach SpokeB directly through the hub without routing through a Network Virtual Appliance (like Azure Firewall). This is intentional for security. Address spaces across peered VNets must not overlap — plan CIDRs carefully before deploying peering.` },
    ],
    code:`# Hub VNet
resource "azurerm_virtual_network" "hub" {
  name                = "vnet-hub-\${local.prefix}"
  address_space       = ["10.0.0.0/16"]
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
}

resource "azurerm_subnet" "hub_bastion" {
  name                 = "AzureBastionSubnet"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.hub.name
  address_prefixes     = ["10.0.1.0/27"]
}

# Spoke VNet
resource "azurerm_virtual_network" "spoke" {
  name                = "vnet-spoke-\${local.prefix}"
  address_space       = ["10.1.0.0/16"]
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
}

resource "azurerm_subnet" "spoke_app" {
  name                 = "app"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.spoke.name
  address_prefixes     = ["10.1.1.0/24"]
}

# Bidirectional peering — BOTH directions required
resource "azurerm_virtual_network_peering" "hub_to_spoke" {
  name                      = "hub-to-spoke"
  resource_group_name       = azurerm_resource_group.main.name
  virtual_network_name      = azurerm_virtual_network.hub.name
  remote_virtual_network_id = azurerm_virtual_network.spoke.id
  allow_virtual_network_access = true
  allow_forwarded_traffic      = true
  allow_gateway_transit        = false
}

resource "azurerm_virtual_network_peering" "spoke_to_hub" {
  name                      = "spoke-to-hub"
  resource_group_name       = azurerm_resource_group.main.name
  virtual_network_name      = azurerm_virtual_network.spoke.name
  remote_virtual_network_id = azurerm_virtual_network.hub.id
  allow_virtual_network_access = true
  allow_forwarded_traffic      = true
  use_remote_gateways          = false
}`,
    codeExplainer:`Two peering resources — one in each direction — this is mandatory. Forgetting either direction means connectivity works from only one side. allow_forwarded_traffic = true enables the spoke to send traffic through the hub for firewall inspection. use_remote_gateways = true would be set if the hub has a VPN or ExpressRoute gateway and the spoke should use it — leave false for this lab.`,
    warnings:[
      "VNet address spaces must not overlap — hub 10.0.0.0/16 and spoke 10.1.0.0/16 are distinct.",
      "Both peering resources must be created — missing one direction causes asymmetric connectivity.",
      "VNet Peering is not transitive — spoke-to-spoke traffic requires routing through NVA in hub.",
      "Peering in different subscriptions or tenants requires the azurerm provider configured for each subscription.",
    ],
  },
  lab:{
    intro:"Build a complete hub-spoke environment: hub VNet with Bastion, spoke VNet with a VM, bidirectional peering, and verify connectivity via Bastion.",
    steps:[
      { title:"Create hub VNet and Bastion", desc:`Hub VNet: 10.0.0.0/16\nAzureBastionSubnet: 10.0.1.0/27\n\nCreate Bastion:\n- azurerm_public_ip.bastion (Standard, Static)\n- azurerm_bastion_host.main referencing AzureBastionSubnet\n\nThe hub exists purely for shared services — no VMs in the hub itself.` },
      { title:"Create spoke VNet and VM", desc:`Spoke VNet: 10.1.0.0/16\napp subnet: 10.1.1.0/24\n\nDeploy a Linux VM in the app subnet with NO public IP.\nThe VM should only be accessible via Bastion in the hub.\n\nSSH key auth, Ubuntu 22.04, Standard_B2s size.` },
      { title:"Create bidirectional peering", desc:`Create both peering resources as shown in the code example.\n\nAfter apply check in portal:\n- hub VNet → Peerings → should show spoke with status Connected\n- spoke VNet → Peerings → should show hub with status Connected\n\nBoth sides must show Connected before connectivity works.` },
      { title:"Verify connectivity via Bastion", desc:`In portal navigate to your spoke VM → Connect → Bastion\n\nEnter username azureadmin and your SSH private key.\n\nIf the connection succeeds you have verified:\n1. Bastion in hub can reach VMs in spoke\n2. VNet peering is working correctly\n3. The VM is accessible without any public IP` },
      { title:"Test VNet-to-VNet connectivity", desc:`From the spoke VM, try to ping or curl the hub Bastion private IP:\n\ncurl -I https://HUB_BASTION_PRIVATE_IP\n\nYou should get a connection (even if TLS error) — proving that spoke→hub traffic flows across the peering.\n\nOutput the private IPs of all resources for easy reference.` },
    ],
  },
  challenge:{
    task:`Add a second spoke VNet (10.2.0.0/16) with its own app subnet and a VM. Peer it to the hub bidirectionally. Then verify that the two spoke VMs CANNOT reach each other directly (proving peering non-transitivity) but both can reach the hub. Output all private IPs and peering states.`,
    hints:[
      `Create spoke2 VNet and peer it to hub — same pattern as spoke1`,
      `Do NOT create a direct peering between spoke1 and spoke2`,
      `From spoke1 VM try to ping spoke2 VM private IP — it should time out`,
      `From spoke1 VM try to ping hub Bastion private IP — it should succeed`,
    ],
    solution:`resource "azurerm_virtual_network" "spoke2" {
  name          = "vnet-spoke2-\${local.prefix}"
  address_space = ["10.2.0.0/16"]
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
}

resource "azurerm_virtual_network_peering" "hub_to_spoke2" {
  name                      = "hub-to-spoke2"
  resource_group_name       = azurerm_resource_group.main.name
  virtual_network_name      = azurerm_virtual_network.hub.name
  remote_virtual_network_id = azurerm_virtual_network.spoke2.id
  allow_virtual_network_access = true
  allow_forwarded_traffic      = true
}

resource "azurerm_virtual_network_peering" "spoke2_to_hub" {
  name                      = "spoke2-to-hub"
  resource_group_name       = azurerm_resource_group.main.name
  virtual_network_name      = azurerm_virtual_network.spoke2.name
  remote_virtual_network_id = azurerm_virtual_network.hub.id
  allow_virtual_network_access = true
  allow_forwarded_traffic      = true
}

output "peering_states" {
  value = {
    hub_to_spoke  = azurerm_virtual_network_peering.hub_to_spoke.peering_state
    spoke_to_hub  = azurerm_virtual_network_peering.spoke_to_hub.peering_state
    hub_to_spoke2 = azurerm_virtual_network_peering.hub_to_spoke2.peering_state
    spoke2_to_hub = azurerm_virtual_network_peering.spoke2_to_hub.peering_state
  }
}`,
  },
  deepDiveTopics:[
    "Azure Virtual WAN — managed hub-spoke at enterprise scale",
    "ExpressRoute and VPN Gateway — connecting on-premises to the hub",
    "Azure Firewall in hub-spoke — routing all spoke traffic through firewall",
    "Peering across subscriptions and tenants — provider aliasing in Terraform",
    "Network topology at 100 spokes — automation patterns for scale",
    "Private DNS zones — centralized DNS resolution across hub-spoke",
  ],
},
// ─── DAY 11 ──────────────────────────────────────────────────────────────────
{
  id:11, phase:2, type:"theory",
  title:"VM Scale Sets & Autoscaling",
  subtitle:"VMSS deployment, autoscale profiles, CPU-based scale rules",
  theory:{
    intro:`Virtual Machine Scale Sets (VMSS) let you deploy and manage a group of identical VMs that can automatically scale in and out based on demand or a schedule. Instead of manually adding VMs during peak traffic you define rules and Azure handles it. In Terraform VMSS replaces the individual VM resource — the scale set manages the VM lifecycle automatically.`,
    concepts:[
      { title:"VMSS vs Individual VMs", body:`Individual VMs (azurerm_linux_virtual_machine) are for fixed-count workloads — databases, management servers, legacy apps. VMSS (azurerm_linux_virtual_machine_scale_set) is for elastic workloads — web servers, app servers, batch processing. VMSS VMs are identical and ephemeral — you should never SSH into a specific VMSS instance and make changes. Configuration is done through cloud-init or extensions applied at scale set level.` },
      { title:"Orchestration Modes", body:`Flexible orchestration mode (recommended for new deployments): VMs can be individually addressed, supports mixing with standalone VMs, better fault domain control, supports more VM families. Uniform orchestration mode (legacy): all VMs are identical, simpler configuration, fewer options. Use Flexible mode unless you have a specific reason for Uniform.` },
      { title:"Autoscale Settings", body:`azurerm_monitor_autoscale_setting defines scale profiles with minimum and maximum instance counts plus scale rules. Each rule has a metric_trigger (CPU percentage, requests, custom metric) and a scale_action (how many instances to add or remove and a cooldown period). Typically create two rules: scale out when CPU > 70% and scale in when CPU < 30%.` },
      { title:"Health Probes and Repair", body:`VMSS can automatically replace unhealthy instances using automatic_instance_repair. Combine with an application health extension or a load balancer health probe. If a VM fails health checks for a configurable grace period (minimum 10 minutes) the scale set deletes it and creates a replacement. This gives you self-healing infrastructure with no manual intervention.` },
      { title:"Upgrade Policies", body:`Defines how VMSS rolls out image updates. Manual: you trigger upgrades explicitly. Automatic: Azure upgrades instances without notice (not suitable for production). Rolling: upgrades batches of instances progressively with health checks between batches (recommended for production). Set max_batch_instance_percent and pause_time_between_batches for controlled rollouts.` },
    ],
    code:`resource "azurerm_linux_virtual_machine_scale_set" "app" {
  name                = "vmss-app-\${local.prefix}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "Standard_B2s"
  instances           = 2          # initial instance count
  admin_username      = "azureadmin"
  upgrade_mode        = "Rolling"

  admin_ssh_key {
    username   = "azureadmin"
    public_key = file("~/.ssh/id_rsa.pub")
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts-gen2"
    version   = "latest"
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
  }

  network_interface {
    name    = "nic"
    primary = true
    ip_configuration {
      name                                   = "internal"
      primary                                = true
      subnet_id                              = azurerm_subnet.subnets["app"].id
      load_balancer_backend_address_pool_ids = [azurerm_lb_backend_address_pool.main.id]
    }
  }

  custom_data = base64encode("#!/bin/bash\napt-get update && apt-get install -y nginx")
}

resource "azurerm_monitor_autoscale_setting" "app" {
  name                = "autoscale-app-\${local.prefix}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  target_resource_id  = azurerm_linux_virtual_machine_scale_set.app.id

  profile {
    name = "default"
    capacity {
      default = 2
      minimum = 1
      maximum = 5
    }
    rule {
      metric_trigger {
        metric_name        = "Percentage CPU"
        metric_resource_id = azurerm_linux_virtual_machine_scale_set.app.id
        time_grain         = "PT1M"
        statistic          = "Average"
        time_window        = "PT5M"
        time_aggregation   = "Average"
        operator           = "GreaterThan"
        threshold          = 70
      }
      scale_action {
        direction = "Increase"
        type      = "ChangeCount"
        value     = "1"
        cooldown  = "PT5M"
      }
    }
    rule {
      metric_trigger {
        metric_name        = "Percentage CPU"
        metric_resource_id = azurerm_linux_virtual_machine_scale_set.app.id
        time_grain         = "PT1M"
        statistic          = "Average"
        time_window        = "PT5M"
        time_aggregation   = "Average"
        operator           = "LessThan"
        threshold          = 30
      }
      scale_action {
        direction = "Decrease"
        type      = "ChangeCount"
        value     = "1"
        cooldown  = "PT5M"
      }
    }
  }
}`,
    codeExplainer:`The VMSS network_interface block is defined inline — not as a separate NIC resource. The load_balancer_backend_address_pool_ids directly registers new instances in the LB backend pool as they scale out. The autoscale setting targets the VMSS by ID and defines a profile with min=1, default=2, max=5. Scale out triggers at >70% CPU averaged over 5 minutes, scale in at <30% with a 5-minute cooldown to prevent flapping.`,
    warnings:[
      "Never SSH into individual VMSS instances and make changes — they will be lost when the instance is replaced.",
      "The cooldown period prevents scale thrashing — do not set it below 5 minutes for CPU-based rules.",
      "instances = 2 in the VMSS resource sets the initial count only — autoscale takes over after first deployment.",
      "Rolling upgrade_mode requires a health extension or LB probe configured — otherwise upgrades stall.",
    ],
  },
  lab:{
    intro:"Deploy a VMSS with 2 initial instances behind the Day 9 Load Balancer, then add autoscale rules for CPU-based scaling.",
    steps:[
      { title:"Replace individual VMs with VMSS", desc:`Remove your azurerm_linux_virtual_machine and azurerm_network_interface resources from Day 9.\n\nCreate azurerm_linux_virtual_machine_scale_set with:\n- instances = 2 (initial count)\n- Same nginx cloud-init as before\n- Network interface block pointing to app subnet\n- LB backend pool ID in ip_configuration` },
      { title:"Connect to the existing Load Balancer", desc:`The VMSS network interface ip_configuration includes:\nload_balancer_backend_address_pool_ids = [azurerm_lb_backend_address_pool.main.id]\n\nThis automatically registers every VMSS instance in the LB backend pool as they come online — no separate association resource needed unlike individual VMs.` },
      { title:"Add autoscale settings", desc:`Create azurerm_monitor_autoscale_setting targeting the VMSS.\n\nProfile capacity:\n- minimum = 1\n- maximum = 5\n- default = 2\n\nTwo rules: scale out when CPU > 70%, scale in when CPU < 30%.\nBoth with PT5M (5 minute) cooldown.` },
      { title:"Verify instances in portal", desc:`portal.azure.com → Virtual Machine Scale Sets → your VMSS → Instances tab\n\nYou should see 2 instances Running.\n\nCheck the Load Balancer backend pool — both VMSS instances should appear as healthy.` },
      { title:"Test autoscale", desc:`To trigger scale out, generate CPU load on a VMSS instance:\nssh into an instance and run: stress --cpu 2 --timeout 300\n\nOr just wait and monitor:\nAzure Monitor → Autoscale → your autoscale setting → Run History\n\nYou will see scale events once CPU thresholds are crossed.` },
    ],
  },
  challenge:{
    task:`Add a second autoscale profile that runs on a schedule: every weekday from 08:00 to 18:00 UTC set the minimum instances to 3 and maximum to 8 (business hours profile). Outside that window fall back to the default profile with minimum 1 and maximum 5. This simulates a business hours scaling pattern.`,
    hints:[
      `Add a second profile{} block inside azurerm_monitor_autoscale_setting`,
      `Use recurrence{ timezone = "UTC", days = ["Monday","Tuesday","Wednesday","Thursday","Friday"], hours = [8], minutes = [0] } for the start`,
      `Create matching recurrence for end time (18:00) back to default capacity`,
      `The profile with recurrence takes precedence over the default profile during its active window`,
    ],
    solution:`profile {
  name = "business-hours"
  capacity {
    default = 3
    minimum = 3
    maximum = 8
  }
  recurrence {
    timezone = "UTC"
    days     = ["Monday","Tuesday","Wednesday","Thursday","Friday"]
    hours    = [8]
    minutes  = [0]
  }
  # Same CPU rules as default profile
}

profile {
  name = "business-hours-end"
  capacity {
    default = 2
    minimum = 1
    maximum = 5
  }
  recurrence {
    timezone = "UTC"
    days     = ["Monday","Tuesday","Wednesday","Thursday","Friday"]
    hours    = [18]
    minutes  = [0]
  }
}`,
  },
  deepDiveTopics:[
    "VMSS Flexible vs Uniform orchestration — detailed comparison",
    "Spot instances in VMSS — eviction policy and cost savings",
    "Custom autoscale metrics — scaling on application-level metrics",
    "VMSS rolling upgrades — zero-downtime image updates",
    "VMSS with Azure DevOps — CI/CD pipeline deploying to scale sets",
    "Stateful VMSS — persistent OS disks and data disks per instance",
  ],
},
// ─── DAY 12 ──────────────────────────────────────────────────────────────────
{
  id:12, phase:2, type:"theory",
  title:"Availability Zones & Sets",
  subtitle:"Zone-redundant resources, availability sets, SLA comparison",
  theory:{
    intro:`Availability Zones and Availability Sets are Azure's mechanisms for protecting workloads from hardware and datacenter failures. Understanding the difference and when to use each is critical for designing resilient Azure infrastructure. Getting this wrong means planned or unplanned maintenance events take down your entire application — a common oversight in cloud migrations.`,
    concepts:[
      { title:"Availability Zones", body:`Availability Zones are physically separate datacenters within an Azure region — each with independent power, cooling, and networking. Deploying resources across zones protects against datacenter-level failures. Not all Azure regions have zones — check the docs. Resources that support zones: VMs, managed disks, Standard LB, Standard Public IPs, AKS node pools. Zone-redundant resources span all zones automatically.` },
      { title:"Availability Sets", body:`Availability Sets protect against rack-level and host-level failures within a single datacenter. They use fault domains (separate power/network racks) and update domains (VMs that restart together during planned maintenance). VMs in an availability set get a 99.95% SLA vs 99.9% for single VMs. Use availability sets when zones are not available in the region or for legacy lift-and-shift workloads.` },
      { title:"Zones vs Sets — When to Use Each", body:`Use Availability Zones when: the region supports them, you want the highest SLA (99.99% for zone-redundant VMs), you can deploy multiple VM instances. Use Availability Sets when: the region does not support zones, you have a single VM per tier and want basic protection, you are migrating legacy applications. For new deployments in zone-capable regions always prefer zones.` },
      { title:"Zone-Redundant Resources in Terraform", body:`Add zones = ["1","2","3"] to VMs, managed disks, and public IPs to pin them to specific zones. For zone-redundant Standard LB add zones = ["1","2","3"] to the frontend IP configuration — the LB automatically distributes across all specified zones. Zone-redundant storage (ZRS) in storage accounts replicates synchronously across three zones.` },
      { title:"SLA Summary", body:`Single VM with Premium SSD: 99.9%. VMs in Availability Set: 99.95%. VMs in Availability Zones (2+ zones): 99.99%. Zone-redundant Standard LB with zone-redundant backends: 99.99%. Always check the Microsoft SLA documentation for the exact numbers as they update periodically. Higher SLA = more complex architecture = higher cost.` },
    ],
    code:`# Availability Zone deployment
resource "azurerm_linux_virtual_machine" "vm_zone1" {
  name                = "vm-zone1-\${local.prefix}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  size                = "Standard_D2s_v3"
  zone                = "1"   # Pin to zone 1
  admin_username      = "azureadmin"
  network_interface_ids = [azurerm_network_interface.vm_zone1.id]
  admin_ssh_key {
    username   = "azureadmin"
    public_key = file("~/.ssh/id_rsa.pub")
  }
  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Premium_LRS"
    disk_size_gb         = 64
  }
  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts-gen2"
    version   = "latest"
  }
}

# Zone-redundant Public IP (spans all zones)
resource "azurerm_public_ip" "zone_redundant" {
  name                = "pip-zr-\${local.prefix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  allocation_method   = "Static"
  sku                 = "Standard"
  zones               = ["1", "2", "3"]
}

# Availability Set (for regions without zones or legacy workloads)
resource "azurerm_availability_set" "main" {
  name                         = "avset-\${local.prefix}"
  location                     = azurerm_resource_group.main.location
  resource_group_name          = azurerm_resource_group.main.name
  platform_fault_domain_count  = 2
  platform_update_domain_count = 5
  managed                      = true
  tags                         = local.tags
}

resource "azurerm_linux_virtual_machine" "vm_avset" {
  name                  = "vm-avset-\${local.prefix}"
  availability_set_id   = azurerm_availability_set.main.id
  # ... rest of VM config
}`,
    codeExplainer:`zone = "1" pins a VM to Availability Zone 1 within the region. zones = ["1","2","3"] on a public IP or LB makes it zone-redundant — it survives any single zone failure. managed = true on the availability set means Azure manages disk placement across fault domains automatically. Note: you cannot use both zone and availability_set_id on the same VM — choose one model.`,
    warnings:[
      "You cannot use both zone= and availability_set_id= on the same VM — pick one redundancy model.",
      "Not all VM sizes are available in all zones — check az vm list-skus --location eastus --zone for availability.",
      "Managed disks must also be zone-pinned to match the VM zone — otherwise VM creation fails.",
      "Zone-redundant resources cost slightly more — factor this into dev vs prod sizing decisions.",
    ],
  },
  lab:{
    intro:"Deploy two VMs across different availability zones behind a zone-redundant Load Balancer to achieve 99.99% SLA architecture.",
    steps:[
      { title:"Update VMs to use zones", desc:`Modify your VM resources to add:\nzone = "1"  # for first VM\nzone = "2"  # for second VM\n\nAlso update os_disk storage_account_type to Premium_LRS — required for zone-pinned VMs to get the full SLA benefit.\n\nUpdate managed disks to use zones = ["1"] and zones = ["2"] respectively.` },
      { title:"Make the Load Balancer zone-redundant", desc:`Update your LB public IP:\nzones = ["1", "2", "3"]\n\nUpdate the LB frontend_ip_configuration to reference this zone-redundant IP.\n\nThis makes the LB frontend survive any single zone failure.` },
      { title:"Update NSG rules if needed", desc:`No changes needed to NSGs for zone configuration — NSGs are not zone-specific.\n\nVerify the existing health probe and LB rule still reference the correct resources after the zone updates.` },
      { title:"Verify zone placement in portal", desc:`portal.azure.com → Virtual Machines → each VM → Overview\n\nLook for the Availability zone field — should show Zone: 1 and Zone: 2.\n\nFor the Public IP: Overview → Zone field should show Zone-redundant.` },
    ],
  },
  challenge:{
    task:`Create a zone-redundant Azure SQL Server (not a SQL MI — just azurerm_mssql_server with a database) with zone_redundant = true on the database. Then output which zones are being used. Research what the zone_redundant flag does differently compared to a non-zone-redundant database in terms of underlying storage replication.`,
    hints:[
      `azurerm_mssql_server does not have a zone argument — zone redundancy is on the database`,
      `azurerm_mssql_database has zone_redundant = true — this uses zone-redundant storage for the database files`,
      `Zone redundant SQL DB requires Business Critical or Premium tier — General Purpose does not support it`,
      `Check the sku_name options: "BC_Gen5_2" for Business Critical, "P1" for Premium`,
    ],
    solution:`resource "azurerm_mssql_server" "main" {
  name                         = "sql-\${local.prefix}-001"
  resource_group_name          = azurerm_resource_group.main.name
  location                     = azurerm_resource_group.main.location
  version                      = "12.0"
  administrator_login          = "sqladmin"
  administrator_login_password = var.sql_admin_password
}

resource "azurerm_mssql_database" "main" {
  name           = "db-app"
  server_id      = azurerm_mssql_server.main.id
  sku_name       = "BC_Gen5_2"
  zone_redundant = true
}

output "sql_server_fqdn" {
  value = azurerm_mssql_server.main.fully_qualified_domain_name
}`,
  },
  deepDiveTopics:[
    "Azure region pairs — how they relate to disaster recovery",
    "SLA calculations — how 99.99% is achieved with multi-zone",
    "Availability Zones support by region — current coverage map",
    "Zone-pinned vs zone-redundant — the difference in Azure resources",
    "Fault domains and update domains — deep dive into availability sets",
    "Azure Site Recovery — cross-region DR with Terraform automation",
  ],
},
// ─── DAY 13 ──────────────────────────────────────────────────────────────────
{
  id:13, phase:3, type:"theory",
  title:"Storage Accounts & Lifecycle Policies",
  subtitle:"Storage tiers, blob containers, lifecycle rules, access control",
  theory:{
    intro:`Azure Storage Accounts are one of the most versatile services in Azure — they provide Blob storage for objects, File Shares for SMB/NFS, Queue storage for messaging, and Table storage for semi-structured data. In Terraform you create the storage account and then individual containers, shares, and queues as child resources. Lifecycle policies automate cost management by moving blobs to cheaper tiers based on age.`,
    concepts:[
      { title:"Storage Account Types", body:`StorageV2 (general-purpose v2): supports all storage services, most feature-rich, use for all new deployments. BlobStorage: blob-only, legacy. BlockBlobStorage: optimised for high-transaction block blob workloads, supports Premium performance tier. FileStorage: optimised for Azure Files Premium. Always use StorageV2 unless you have a specific reason for another type — it is the most capable and cost-effective general option.` },
      { title:"Replication Options", body:`LRS (Locally Redundant Storage): 3 copies in one datacenter, cheapest, 11 nines durability. ZRS (Zone-Redundant Storage): 3 copies across 3 zones in one region, 12 nines durability. GRS (Geo-Redundant Storage): LRS + async copy to paired region, 16 nines durability. GZRS (Geo-Zone-Redundant Storage): ZRS + async copy to paired region, highest durability, most expensive. Use LRS for dev, ZRS for production, GRS/GZRS for compliance-driven backup requirements.` },
      { title:"Access Tiers", body:`Hot: optimised for data accessed frequently, highest storage cost, lowest access cost. Cool: optimised for data accessed infrequently, stored for at least 30 days, lower storage cost, higher access cost. Archive: offline storage for data rarely accessed, lowest storage cost, highest access/retrieval cost, minimum 180-day retention, rehydration takes hours. Set access_tier on the storage account as the default tier for new blobs.` },
      { title:"Lifecycle Management", body:`Lifecycle policies automatically transition blobs between tiers or delete them based on age rules. A rule applies to blobs matching a filter (by prefix or blob type) and takes actions after specified days since modification. Common pattern: transition to Cool after 30 days, Archive after 90 days, delete after 365 days. This eliminates manual blob management and significantly reduces storage costs over time.` },
      { title:"Security Settings", body:`min_tls_version = "TLS1_2" is a baseline requirement. public_network_access_enabled = false for production (use private endpoints). https_traffic_only_enabled = true to reject HTTP. enable_https_traffic_only is deprecated — use https_traffic_only_enabled. For Terraform state storage enable shared_access_key_enabled = true. For app storage prefer managed identity over access keys.` },
    ],
    code:`resource "azurerm_storage_account" "main" {
  name                     = local.st_name
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = var.environment == "prod" ? "ZRS" : "LRS"
  account_kind             = "StorageV2"
  access_tier              = "Hot"
  min_tls_version          = "TLS1_2"
  https_traffic_only_enabled = true
  public_network_access_enabled = false
  tags = local.tags
}

# Blob container
resource "azurerm_storage_container" "app_data" {
  name                  = "app-data"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"  # never use "blob" or "container" in production
}

# Lifecycle management policy
resource "azurerm_storage_management_policy" "main" {
  storage_account_id = azurerm_storage_account.main.id

  rule {
    name    = "archive-old-blobs"
    enabled = true

    filters {
      prefix_match = ["app-data/logs/"]
      blob_types   = ["blockBlob"]
    }

    actions {
      base_blob {
        tier_to_cool_after_days_since_modification_greater_than    = 30
        tier_to_archive_after_days_since_modification_greater_than = 90
        delete_after_days_since_modification_greater_than          = 365
      }
      snapshot {
        delete_after_days_since_creation_greater_than = 30
      }
    }
  }
}

output "storage_account_name"        { value = azurerm_storage_account.main.name }
output "primary_blob_endpoint"        { value = azurerm_storage_account.main.primary_blob_endpoint }
output "storage_connection_string" {
  value     = azurerm_storage_account.main.primary_connection_string
  sensitive = true
}`,
    codeExplainer:`container_access_type = "private" means no anonymous public access — access requires a key or SAS token. The lifecycle rule applies only to blobs under the app-data/logs/ prefix. Blobs move to Cool at 30 days (saves ~40% vs Hot), Archive at 90 days (saves ~90% vs Hot), and are deleted at 365 days. Snapshots older than 30 days are deleted automatically to prevent snapshot cost accumulation.`,
    warnings:[
      "Storage account names are globally unique across ALL of Azure — not just your subscription.",
      "Never use container_access_type = 'blob' or 'container' in production — always 'private'.",
      "Archive tier blobs cannot be read directly — they must be rehydrated to Hot or Cool first (takes hours).",
      "Deleting a storage account destroys all data inside it instantly and irreversibly — use lifecycle policies for controlled deletion.",
    ],
  },
  lab:{
    intro:"Create a production-ready storage account with multiple containers and a lifecycle policy that automates cost management.",
    steps:[
      { title:"Create a secure storage account", desc:`Use the code example as a base. Set:\n- account_replication_type based on environment (LRS/ZRS)\n- min_tls_version = "TLS1_2"\n- https_traffic_only_enabled = true\n- public_network_access_enabled = false (disable public access)\n\nRun terraform apply and verify in portal that all security settings appear correctly.` },
      { title:"Create three containers", desc:`Create separate azurerm_storage_container resources for:\n- "app-data" (private access)\n- "backups" (private access)\n- "terraform-state" (private access, for future use as TF backend)\n\nAll three should use container_access_type = "private"` },
      { title:"Add a lifecycle management policy", desc:`Create azurerm_storage_management_policy targeting your storage account.\n\nAdd two rules:\n1. For app-data/ prefix: Cool after 30d, Archive after 90d, Delete after 365d\n2. For backups/ prefix: Cool after 7d, Archive after 30d, Delete after 90d` },
      { title:"Test uploading and lifecycle", desc:`Upload a test blob via CLI:\naz storage blob upload \\\n  --account-name YOUR_ST_NAME \\\n  --container-name app-data \\\n  --name logs/test.txt \\\n  --file test.txt \\\n  --auth-mode login\n\nVerify the blob appears in portal and has Hot access tier.` },
      { title:"Add outputs", desc:`Add outputs for:\n- storage_account_name\n- primary_blob_endpoint\n- storage_account_id (needed for lifecycle policy reference)\n- primary_connection_string (sensitive = true)` },
    ],
  },
  challenge:{
    task:`Configure the storage account to use a customer-managed key (CMK) from the Key Vault you created in Day 5 for encryption at rest. This requires enabling the storage account's identity block with a system-assigned managed identity, granting that identity Key Vault crypto permissions, and referencing the Key Vault key in the storage account customer_managed_key block.`,
    hints:[
      `Add identity { type = "SystemAssigned" } to the storage account resource`,
      `After apply the storage account gets an object_id — grant it Key Vault Crypto Service Encryption User role`,
      `Create azurerm_key_vault_key with key_type = "RSA", key_size = 2048`,
      `Add customer_managed_key { key_vault_key_id = azurerm_key_vault_key.main.id } to storage account`,
    ],
    solution:`resource "azurerm_key_vault_key" "storage" {
  name         = "key-storage-encryption"
  key_vault_id = azurerm_key_vault.main.id
  key_type     = "RSA"
  key_size     = 2048
  key_opts     = ["decrypt","encrypt","sign","unwrapKey","verify","wrapKey"]
}

resource "azurerm_storage_account" "main" {
  # ... existing config ...
  identity { type = "SystemAssigned" }
  customer_managed_key {
    key_vault_key_id          = azurerm_key_vault_key.storage.id
    user_assigned_identity_id = null
  }
}

resource "azurerm_role_assignment" "storage_kv" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Crypto Service Encryption User"
  principal_id         = azurerm_storage_account.main.identity[0].principal_id
}`,
  },
  deepDiveTopics:[
    "Azure Files vs Blob Storage — choosing the right storage type",
    "Storage account private endpoints — complete DNS configuration",
    "SAS tokens vs managed identity — secure blob access patterns",
    "Immutable blob storage — WORM compliance for regulated industries",
    "Azure Data Lake Storage Gen2 — hierarchical namespace for analytics",
    "Cross-region replication — GRS failover mechanics and RTO/RPO",
  ],
},
// ─── DAY 14 ──────────────────────────────────────────────────────────────────
{
  id:14, phase:3, type:"theory",
  title:"Azure Key Vault & Secrets Management",
  subtitle:"Key Vault secrets, access policies vs RBAC, data sources, rotation",
  theory:{
    intro:`Key Vault is Azure's central secrets management service — it stores passwords, connection strings, certificates, and cryptographic keys securely with full audit logging, access control, and optional hardware-backed HSM storage. In Terraform Key Vault is both a resource you create AND a data source you read from. The two most important patterns are: storing generated passwords in Key Vault, and referencing existing secrets as data sources without hardcoding them in HCL.`,
    concepts:[
      { title:"Key Vault Access Models", body:`Two models exist for authorizing access to Key Vault. Access Policies (legacy): assigned per-identity at the vault level — you grant a service principal or user specific permissions (Get, List, Set, Delete) for secrets, keys, and certificates separately. Azure RBAC (recommended): uses standard Azure role assignments scoped to the vault, secret, key, or certificate level. Built-in roles: Key Vault Secrets Officer (full access), Key Vault Secrets User (read-only), Key Vault Crypto Officer, Key Vault Certificate Officer.` },
      { title:"Soft Delete and Purge Protection", body:`Soft delete is mandatory — a deleted Key Vault or secret enters a recoverable deleted state for soft_delete_retention_days (7–90 days). During this window the name cannot be reused. purge_protection_enabled = true prevents anyone from permanently deleting the vault or secrets even as an admin — required for compliance. In dev set purge_protection_enabled = false and add purge_soft_delete_on_destroy = true to the provider features block to allow clean iteration.` },
      { title:"Storing Secrets via Terraform", body:`azurerm_key_vault_secret creates a secret in Key Vault. The value can be a generated random password, a connection string interpolated from other resources, or a variable (use sensitive = true on the variable). Never store a secret value in .tfvars files committed to git. The secret is stored encrypted in Key Vault and also appears in Terraform state — protect state file access accordingly.` },
      { title:"Reading Secrets as Data Sources", body:`data "azurerm_key_vault_secret" reads an existing secret without creating it. Use this pattern when: a secret was created manually or by another process, you need to inject a secret into a VM or app configuration without knowing its value in Terraform code. Reference the secret value as data.azurerm_key_vault_secret.db_password.value — marked sensitive so it never appears in plan output.` },
      { title:"Secret Versioning", body:`Every time you update a secret value Key Vault creates a new version while keeping all previous versions accessible. The current version is always returned unless you specify a version. Secret rotation: in Terraform you can trigger a new version by updating the value attribute. For automated rotation use Azure Event Grid + Azure Functions triggered by the SecretNearExpiry event.` },
    ],
    code:`# Create Key Vault (from Day 5 baseline)
resource "azurerm_key_vault" "main" {
  name                       = local.kv_name
  location                   = azurerm_resource_group.main.location
  resource_group_name        = azurerm_resource_group.main.name
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  sku_name                   = "standard"
  purge_protection_enabled   = var.environment == "prod"
  soft_delete_retention_days = 7
  enable_rbac_authorization  = true  # Use RBAC model
  tags                       = local.tags
}

# Grant Terraform identity Key Vault Secrets Officer role
resource "azurerm_role_assignment" "kv_tf_secrets_officer" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets Officer"
  principal_id         = data.azurerm_client_config.current.object_id
}

# Generate a random password
resource "random_password" "db" {
  length           = 24
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# Store it in Key Vault
resource "azurerm_key_vault_secret" "db_password" {
  name         = "db-admin-password"
  value        = random_password.db.result
  key_vault_id = azurerm_key_vault.main.id
  depends_on   = [azurerm_role_assignment.kv_tf_secrets_officer]
  tags         = { managed_by = "terraform", purpose = "database-admin" }
}

# Read an existing secret (created outside Terraform)
data "azurerm_key_vault" "shared" {
  name                = "kv-shared-prod"
  resource_group_name = "rg-shared-prod"
}

data "azurerm_key_vault_secret" "api_key" {
  name         = "third-party-api-key"
  key_vault_id = data.azurerm_key_vault.shared.id
}

# Use the secret value in another resource
resource "azurerm_linux_virtual_machine" "app" {
  # ...
  custom_data = base64encode(<<-EOF
    #!/bin/bash
    echo "API_KEY=\${data.azurerm_key_vault_secret.api_key.value}" >> /etc/app.env
  EOF
  )
}`,
    codeExplainer:`enable_rbac_authorization = true switches Key Vault to RBAC mode — more scalable than access policies. The role assignment grants Terraform's own identity Secrets Officer access. depends_on on the secret resource ensures the role assignment exists before trying to write — without this Terraform may try to create the secret before the role assignment propagates (usually 30–60 seconds).`,
    warnings:[
      "depends_on = [azurerm_role_assignment.kv_tf_secrets_officer] is required — RBAC changes take up to 5 minutes to propagate.",
      "Secret values appear in Terraform state in plaintext — protect state file access like a secrets file.",
      "enable_rbac_authorization cannot be changed after Key Vault creation without destroying and recreating.",
      "random_password generates a new value on every plan if not stabilised with keepers — causing unnecessary secret rotations.",
    ],
  },
  lab:{
    intro:"Create a Key Vault with RBAC authorization, generate and store a database password, and reference it from another resource.",
    steps:[
      { title:"Create Key Vault with RBAC mode", desc:`Use enable_rbac_authorization = true.\n\nThis switches from the legacy access policy model to standard Azure RBAC.\n\nAdd purge_protection_enabled = var.environment == "prod" so dev environments can be destroyed cleanly.` },
      { title:"Grant Terraform the Secrets Officer role", desc:`Create azurerm_role_assignment:\n- scope = azurerm_key_vault.main.id\n- role_definition_name = "Key Vault Secrets Officer"\n- principal_id = data.azurerm_client_config.current.object_id\n\nThis gives your Terraform identity (CLI user or SP) full secrets management on this vault.` },
      { title:"Generate and store a password", desc:`Add hashicorp/random to required_providers if not already there.\n\nresource "random_password" "db" {\n  length           = 24\n  special          = true\n  override_special = "!#$%&*()-_=+[]"\n  keepers = { version = "1" }\n}\n\nresource "azurerm_key_vault_secret" "db_password" {\n  name         = "db-admin-password"\n  value        = random_password.db.result\n  key_vault_id = azurerm_key_vault.main.id\n  depends_on   = [azurerm_role_assignment.kv_tf_secrets_officer]\n}` },
      { title:"Verify in Key Vault", desc:`portal.azure.com → Key Vault → your vault → Secrets\n\nYou should see db-admin-password listed.\n\nClick it to see the current version. Note you can see metadata (creation date, enabled status) but the value requires explicit Show Secret Value click — audit logged.` },
      { title:"Read the secret back as a data source", desc:`Add:\ndata "azurerm_key_vault_secret" "db_password" {\n  name         = "db-admin-password"\n  key_vault_id = azurerm_key_vault.main.id\n  depends_on   = [azurerm_key_vault_secret.db_password]\n}\n\noutput "password_version" {\n  value = data.azurerm_key_vault_secret.db_password.version\n}\n\nNote: the output shows the version ID not the password value.` },
    ],
  },
  challenge:{
    task:`Set an expiry date on the Key Vault secret using the expiration_date attribute — set it to 90 days from today. Then create an Azure Monitor alert that fires when a Key Vault secret is within 30 days of expiration using azurerm_monitor_metric_alert. Output the expiry date in ISO 8601 format.`,
    hints:[
      `expiration_date = timeadd(timestamp(), "2160h") — 2160 hours = 90 days`,
      `timeadd and timestamp() are Terraform built-in functions`,
      `formatdate("YYYY-MM-DD", timeadd(timestamp(), "2160h")) for a readable output`,
      `azurerm_monitor_metric_alert with metric_name = "SecretNearExpiryCount" on Key Vault`,
    ],
    solution:`resource "azurerm_key_vault_secret" "db_password" {
  name            = "db-admin-password"
  value           = random_password.db.result
  key_vault_id    = azurerm_key_vault.main.id
  expiration_date = timeadd(timestamp(), "2160h")  # 90 days
  depends_on      = [azurerm_role_assignment.kv_tf_secrets_officer]
}

output "secret_expiry" {
  value = formatdate("YYYY-MM-DD", timeadd(timestamp(), "2160h"))
}

resource "azurerm_monitor_metric_alert" "secret_expiry" {
  name                = "alert-secret-expiry-\${local.prefix}"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_key_vault.main.id]
  criteria {
    metric_namespace = "Microsoft.KeyVault/vaults"
    metric_name      = "SecretNearExpiryCount"
    aggregation      = "Total"
    operator         = "GreaterThan"
    threshold        = 0
  }
}`,
  },
  deepDiveTopics:[
    "Key Vault Premium vs Standard — HSM-backed keys for compliance",
    "Managed HSM — dedicated HSM module for FIPS 140-2 Level 3",
    "Secret rotation automation — Event Grid plus Azure Functions",
    "Key Vault firewall and private endpoint configuration",
    "Certificate management — importing and auto-renewing TLS certificates",
    "Key Vault references in App Service — dynamic secret injection",
  ],
},
// ─── DAY 15 ──────────────────────────────────────────────────────────────────
{
  id:15, phase:3, type:"theory",
  title:"Azure SQL Database",
  subtitle:"SQL Server, databases, firewall rules, elastic pools, private endpoints",
  theory:{
    intro:`Azure SQL Database is Microsoft's fully managed relational database service built on SQL Server. In Terraform you create a logical SQL Server first (the management container) and then databases within it. The server holds firewall rules, authentication settings, and AD admin configuration. The database holds the actual data, performance tier, and backup settings. Understanding this two-level hierarchy is essential before writing any SQL Terraform code.`,
    concepts:[
      { title:"SQL Server vs SQL Database", body:`azurerm_mssql_server is the logical server — it has no compute or storage itself. It manages authentication (SQL auth and/or Entra ID auth), firewall rules, and is the parent for databases. azurerm_mssql_database is the actual database — it has the compute (vCores or DTUs), storage, backup retention, and data. One server can host multiple databases but each database belongs to exactly one server.` },
      { title:"Purchasing Models", body:`DTU model (legacy): Database Transaction Units bundle CPU, memory, and I/O in preset packages. S0 (10 DTUs) to P15 (4000 DTUs). Simple pricing but no flexibility. vCore model (recommended): choose vCores and memory independently. General Purpose (GP), Business Critical (BC), or Hyperscale tiers. Use GP for standard workloads, BC for OLTP with IO-intensive workloads, Hyperscale for databases needing rapid scale above 100GB.` },
      { title:"Authentication", body:`Two authentication options: SQL authentication (username + password stored in SQL Server) and Azure AD / Entra ID authentication (users and groups from your directory). Best practice: disable SQL auth in production and use Entra ID. In Terraform: set azuread_administrator block with object_id of your admin group. The azurerm_mssql_server still requires administrator_login_password even if you plan to disable SQL auth — use a strong generated password and store it in Key Vault.` },
      { title:"Firewall Rules", body:`By default Azure SQL Database blocks all connections. azurerm_mssql_firewall_rule adds IP-based allow rules. The special rule allow_azure_services_to_access_server = true (or a firewall rule with start_ip_address = "0.0.0.0" and end_ip_address = "0.0.0.0") allows Azure services access. For production: disable public network access entirely and use a private endpoint so traffic stays on the Azure backbone.` },
      { title:"Elastic Pools", body:`azurerm_mssql_elasticpool groups multiple databases that share a pool of DTUs or vCores. Databases in the pool can burst to use idle resources from other databases — cost-efficient when databases have different peak usage times. Common for SaaS multi-tenant architectures where each tenant has a database. The pool has a maximum size in GB and a maximum DTU/vCore limit per database.` },
    ],
    code:`resource "azurerm_mssql_server" "main" {
  name                         = "sql-\${local.prefix}-001"
  resource_group_name          = azurerm_resource_group.main.name
  location                     = azurerm_resource_group.main.location
  version                      = "12.0"
  administrator_login          = "sqladmin"
  administrator_login_password = azurerm_key_vault_secret.db_password.value

  # Entra ID admin
  azuread_administrator {
    login_username = "AzureAD Admin"
    object_id      = data.azurerm_client_config.current.object_id
  }

  minimum_tls_version = "1.2"
  tags                = local.tags
}

# Allow your admin IP (dev only — use private endpoint in prod)
resource "azurerm_mssql_firewall_rule" "admin_ip" {
  name             = "allow-admin-ip"
  server_id        = azurerm_mssql_server.main.id
  start_ip_address = var.admin_ip
  end_ip_address   = var.admin_ip
}

# Allow Azure services (dev only)
resource "azurerm_mssql_firewall_rule" "azure_services" {
  name             = "allow-azure-services"
  server_id        = azurerm_mssql_server.main.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

resource "azurerm_mssql_database" "app" {
  name         = "db-app"
  server_id    = azurerm_mssql_server.main.id
  sku_name     = var.environment == "prod" ? "GP_Gen5_4" : "S1"
  max_size_gb  = var.environment == "prod" ? 100 : 10
  zone_redundant = var.environment == "prod"

  short_term_retention_policy {
    retention_days = var.environment == "prod" ? 35 : 7
  }

  tags = local.tags
}

output "sql_server_fqdn"  { value = azurerm_mssql_server.main.fully_qualified_domain_name }
output "sql_database_name" { value = azurerm_mssql_database.app.name }`,
    codeExplainer:`The administrator_login_password references the Key Vault secret from Day 14 — the password is never in the .tf file. The database sku_name changes between dev (S1 = cheap DTU tier) and prod (GP_Gen5_4 = 4 vCore General Purpose). short_term_retention_policy controls the point-in-time restore window — 35 days in prod for compliance, 7 days in dev to save costs.`,
    warnings:[
      "SQL Server names are globally unique across Azure — prefix with something specific to your project.",
      "The administrator_login_password must be stored securely — reference it from Key Vault, never hardcode.",
      "allow_azure_services_to_access_server = true is convenient but allows any Azure resource to attempt connection — disable in production.",
      "Changing sku_name may cause a brief connection interruption during the scaling operation.",
    ],
  },
  lab:{
    intro:"Deploy a logical SQL Server with an application database, firewall rules for dev access, and Entra ID admin configuration.",
    steps:[
      { title:"Create the SQL Server", desc:`Use the Day 14 Key Vault secret for the administrator_login_password.\n\nazurerm_mssql_server requires:\n- name (globally unique, 1–63 chars, lowercase alphanumeric and hyphens)\n- version = "12.0" (the current SQL Server version)\n- administrator_login = "sqladmin"\n- administrator_login_password = azurerm_key_vault_secret.db_password.value\n- minimum_tls_version = "1.2"` },
      { title:"Add firewall rules", desc:`Add two firewall rules for dev:\n1. Your admin IP: var.admin_ip (get it from whatismyip.com)\n2. Azure services: start_ip = "0.0.0.0", end_ip = "0.0.0.0"\n\nIn production you would remove both these rules and use a private endpoint instead.` },
      { title:"Create the database", desc:`azurerm_mssql_database:\n- server_id = azurerm_mssql_server.main.id\n- sku_name = "S1" (dev — Standard tier, 20 DTUs, ~$15/month)\n- max_size_gb = 10\n- short_term_retention_policy { retention_days = 7 }` },
      { title:"Connect and verify", desc:`Get the server FQDN:\nterraform output sql_server_fqdn\n\nConnect with sqlcmd:\nsqlcmd -S YOUR_SERVER.database.windows.net -U sqladmin -P YOUR_PASSWORD -d db-app -Q "SELECT @@VERSION"\n\nOr use Azure Data Studio / SSMS with the FQDN and SQL credentials.` },
      { title:"Add Entra ID admin", desc:`Add azuread_administrator block to the SQL Server:\nazuread_administrator {\n  login_username = "TerraformAdmin"\n  object_id      = data.azurerm_client_config.current.object_id\n  tenant_id      = data.azurerm_client_config.current.tenant_id\n}\n\nThis lets you connect with your Azure AD credentials instead of the SQL password.` },
    ],
  },
  challenge:{
    task:`Create an elastic pool and move the app database into it. Configure the pool with: Standard tier, 100 DTUs total, minimum 0 DTUs per database, maximum 50 DTUs per database. Then create a second database in the same pool called db-reports. Output the pool's total DTU capacity and the names of databases in the pool.`,
    hints:[
      `resource "azurerm_mssql_elasticpool" — must be in the same location and resource group as the SQL server`,
      `sku { name = "StandardPool", tier = "Standard", capacity = 100 }`,
      `per_database_settings { min_capacity = 0, max_capacity = 50 }`,
      `On each database: elastic_pool_id = azurerm_mssql_elasticpool.main.id (and remove sku_name from the database)`,
    ],
    solution:`resource "azurerm_mssql_elasticpool" "main" {
  name                = "pool-\${local.prefix}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  server_name         = azurerm_mssql_server.main.name
  sku {
    name     = "StandardPool"
    tier     = "Standard"
    capacity = 100
  }
  per_database_settings {
    min_capacity = 0
    max_capacity = 50
  }
}

resource "azurerm_mssql_database" "app" {
  name            = "db-app"
  server_id       = azurerm_mssql_server.main.id
  elastic_pool_id = azurerm_mssql_elasticpool.main.id
}

resource "azurerm_mssql_database" "reports" {
  name            = "db-reports"
  server_id       = azurerm_mssql_server.main.id
  elastic_pool_id = azurerm_mssql_elasticpool.main.id
}`,
  },
  deepDiveTopics:[
    "Private endpoint for Azure SQL — DNS and network configuration",
    "SQL Database auditing — shipping logs to Log Analytics",
    "Geo-replication and failover groups — cross-region SQL HA",
    "SQL Managed Instance vs SQL Database — when to use each",
    "Transparent Data Encryption — customer-managed keys",
    "SQL Database backup and point-in-time restore via Terraform",
  ],
},
// ─── DAY 16 ──────────────────────────────────────────────────────────────────
{
  id:16, phase:3, type:"theory",
  title:"Cosmos DB & Managed Databases",
  subtitle:"Cosmos DB accounts, databases, throughput, consistency levels",
  theory:{
    intro:`Azure Cosmos DB is Microsoft's globally distributed, multi-model NoSQL database. It supports multiple APIs — SQL (document), MongoDB, Cassandra, Gremlin (graph), and Table. It provides single-digit millisecond latency at global scale with five tunable consistency levels. In Terraform you create the Cosmos DB account first, then databases and containers/collections within it. The account holds global configuration; the database holds logical groupings; the container holds your actual documents.`,
    concepts:[
      { title:"Cosmos DB Account Configuration", body:`The account is the top-level resource containing the API choice, consistency level, geo-replication locations, and networking settings. kind = "GlobalDocumentDB" for SQL and Gremlin APIs, "MongoDB" for MongoDB API, "Parse" for Table API. capabilities block enables specific features. consistency_policy sets the default consistency level — this cannot be changed without recreating the account for some API types.` },
      { title:"Consistency Levels", body:`Five levels from strongest to weakest: Strong (linearizability, highest latency), Bounded Staleness (configurable lag by operations or time), Session (consistent within a session — most popular for user-specific apps), Consistent Prefix (no out-of-order reads), Eventual (lowest latency, no ordering guarantees). Session consistency is the recommended default for most applications — it provides strong consistency within a user's session at low latency.` },
      { title:"Throughput — RU/s", body:`Cosmos DB bills on Request Units per second (RU/s). A simple 1KB document read costs approximately 1 RU. A write costs 5 RUs. Complex queries cost more. You provision RU/s at database level (shared across containers) or container level (dedicated). Manual throughput: fixed RU/s you pay regardless of usage. Autoscale: set a max RU/s and Cosmos scales between 10% and 100% of max based on demand — more efficient for variable workloads.` },
      { title:"Partitioning", body:`Every Cosmos DB container has a partition key — a property in your documents that Cosmos uses to distribute data across physical partitions. Choosing a good partition key is critical for performance: it should have high cardinality (many distinct values), distribute writes evenly, and be included in most queries. Poor choices like a boolean field or country code with only a few values cause hot partitions and performance bottlenecks.` },
      { title:"Geo-replication", body:`Add additional geo_location blocks to replicate your Cosmos DB globally. The first location is the write region (failover_priority = 0). Additional locations are read replicas. With enable_automatic_failover = true Cosmos promotes a read replica to write region automatically if the primary fails. Each additional region adds full cost — budget accordingly.` },
    ],
    code:`resource "azurerm_cosmosdb_account" "main" {
  name                = "cosmos-\${local.prefix}-001"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  offer_type          = "Standard"
  kind                = "GlobalDocumentDB"  # SQL API

  consistency_policy {
    consistency_level       = "Session"
    max_interval_in_seconds = 5
    max_staleness_prefix    = 100
  }

  geo_location {
    location          = azurerm_resource_group.main.location
    failover_priority = 0
  }

  # Add a read replica (optional, doubles cost)
  # geo_location {
  #   location          = "West Europe"
  #   failover_priority = 1
  # }

  enable_automatic_failover       = false
  public_network_access_enabled   = true  # set false in prod
  is_virtual_network_filter_enabled = false
  tags                            = local.tags
}

resource "azurerm_cosmosdb_sql_database" "app" {
  name                = "db-app"
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
}

resource "azurerm_cosmosdb_sql_container" "items" {
  name                = "items"
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
  database_name       = azurerm_cosmosdb_sql_database.app.name
  partition_key_path  = "/tenantId"
  partition_key_version = 2

  # Autoscale throughput: min 400 RU/s, max 4000 RU/s
  autoscale_settings {
    max_throughput = 4000
  }

  indexing_policy {
    indexing_mode = "consistent"
    included_path { path = "/*" }
    excluded_path { path = "/\"_etag\"/?" }
  }
}

output "cosmos_endpoint"   { value = azurerm_cosmosdb_account.main.endpoint }
output "cosmos_primary_key" {
  value     = azurerm_cosmosdb_account.main.primary_key
  sensitive = true
}`,
    codeExplainer:`offer_type = "Standard" is the only available option. kind = "GlobalDocumentDB" enables the SQL (Core) API which supports structured query language against JSON documents. autoscale_settings with max_throughput = 4000 means Cosmos scales between 400 (10% of max) and 4000 RU/s automatically — you only pay for what you use. partition_key_path = "/tenantId" is ideal for multi-tenant SaaS apps since each tenant's data stays in its own partition.`,
    warnings:[
      "Cosmos DB account names are globally unique — they appear in the endpoint URL cosmos.azure.com.",
      "Deleting a Cosmos DB account with data inside it is instant and irreversible without a backup.",
      "Autoscale minimum is always 10% of max_throughput — 4000 max means minimum 400 RU/s charge.",
      "Changing consistency_level on an existing account may require account recreation depending on API.",
    ],
  },
  lab:{
    intro:"Deploy a Cosmos DB SQL API account with a database, container, and autoscale throughput.",
    steps:[
      { title:"Create the Cosmos DB account", desc:`azurerm_cosmosdb_account:\n- name: globally unique (cosmos-yourproject-dev-001)\n- offer_type = "Standard"\n- kind = "GlobalDocumentDB"\n- consistency_policy: Session level\n- geo_location: your primary region with failover_priority = 0\n\nApply and note it takes 5–10 minutes to provision.` },
      { title:"Create database and container", desc:`azurerm_cosmosdb_sql_database referencing the account.\n\nazurerm_cosmosdb_sql_container with:\n- partition_key_path = "/id" (simple for testing)\n- autoscale_settings { max_throughput = 1000 } (minimum viable for cost)\n\nNote: 1000 RU/s max means you pay for minimum 100 RU/s at all times.` },
      { title:"Connect via Data Explorer", desc:`portal.azure.com → Cosmos DB → your account → Data Explorer\n\nYou should see your database and container.\n\nCreate a test document:\n{\n  "id": "test-001",\n  "name": "Test Item",\n  "category": "test"\n}\n\nQuery it: SELECT * FROM c WHERE c.id = "test-001"` },
      { title:"Add outputs", desc:`output "cosmos_endpoint" { value = azurerm_cosmosdb_account.main.endpoint }\noutput "cosmos_primary_key" {\n  value     = azurerm_cosmosdb_account.main.primary_key\n  sensitive = true\n}\n\nThe endpoint is the HTTPS URL your application connects to.\nThe primary key is the master key — treat it like a password.` },
    ],
  },
  challenge:{
    task:`Add a second geo_location block to replicate the Cosmos DB account to West Europe with failover_priority = 1 and enable_automatic_failover = true. Then create a diagnostic setting that ships Cosmos DB logs (DataPlaneRequests and QueryRuntimeStatistics) to a Log Analytics workspace. Output both regions and their failover priorities.`,
    hints:[
      `Add a second geo_location { location = "West Europe", failover_priority = 1 } block`,
      `Set enable_automatic_failover = true on the account`,
      `azurerm_log_analytics_workspace first, then azurerm_monitor_diagnostic_setting referencing both`,
      `log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id in the diagnostic setting`,
    ],
    solution:`resource "azurerm_cosmosdb_account" "main" {
  # ... existing config ...
  geo_location {
    location          = azurerm_resource_group.main.location
    failover_priority = 0
  }
  geo_location {
    location          = "West Europe"
    failover_priority = 1
  }
  enable_automatic_failover = true
}

resource "azurerm_log_analytics_workspace" "main" {
  name                = "law-\${local.prefix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
}

resource "azurerm_monitor_diagnostic_setting" "cosmos" {
  name                       = "cosmos-diagnostics"
  target_resource_id         = azurerm_cosmosdb_account.main.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  enabled_log { category = "DataPlaneRequests" }
  enabled_log { category = "QueryRuntimeStatistics" }
  metric { category = "Requests" }
}`,
  },
  deepDiveTopics:[
    "Cosmos DB partitioning — choosing the right partition key",
    "Cosmos DB indexing policy — include/exclude paths for cost optimisation",
    "Change feed — real-time event streaming from Cosmos DB",
    "Cosmos DB backup and restore — continuous vs periodic backup",
    "Server-side programming — stored procedures and triggers",
    "Cosmos DB with Azure Functions — event-driven data processing",
  ],
},
// ─── DAY 17 ──────────────────────────────────────────────────────────────────
{
  id:17, phase:3, type:"project",
  title:"PROJECT — 3-Tier App Infrastructure",
  subtitle:"LB + VMs + SQL + Key Vault + Storage wired into a complete architecture",
  theory:{
    intro:`Today you build a complete 3-tier application infrastructure: a public Load Balancer distributing traffic to an app tier of VMs, which connect to a backend Azure SQL database, with secrets stored in Key Vault and application data in a Storage Account. This is the foundational pattern for deploying web applications on Azure — the same architecture used in production environments across enterprise clients. Every component references another, forming a fully connected infrastructure graph.`,
    concepts:[
      { title:"3-Tier Architecture Overview", body:`Tier 1 (Web/Presentation): Load Balancer + VMSS or VMs running your web server. Tier 2 (Application): VMs or App Service running business logic, connecting to the database. Tier 3 (Data): Azure SQL Database or Cosmos DB. Supporting services: Key Vault for secrets, Storage Account for files and logs, VNet with NSGs for network segmentation. Each tier lives in its own subnet with NSG rules allowing only the minimum required traffic.` },
      { title:"Resource Dependency Chain", body:`The full dependency order Terraform must resolve: VNet → Subnets → NSGs → NSG Associations → Public IPs → NICs → VMs / VMSS → LB Backend Pool → LB Probe → LB Rule → NIC/VMSS Backend Association. Parallel to this: Key Vault → Secrets → SQL Server (using KV secret for password) → Database → Storage Account. Terraform builds this directed acyclic graph from attribute references and executes in the correct order automatically.` },
      { title:"Secrets Flow", body:`All passwords are generated by the random provider → stored in Key Vault → referenced via azurerm_key_vault_secret.xxx.value when passed to SQL Server and VMs. The VMs read API keys and connection strings from Key Vault at startup via cloud-init script that uses the Azure CLI with managed identity. No secret ever appears hardcoded in any .tf file.` },
      { title:"NSG Rules for 3-Tier", body:`Web subnet NSG: allow 80/443 from Internet, allow return traffic from LB health probe (source AzureLoadBalancer). App subnet NSG: allow 8080 from web subnet only, deny from Internet. Data subnet NSG: allow 1433 from app subnet only, deny everything else. Mgmt subnet NSG: allow 3389/22 from your admin IP only. This creates defence in depth — even if the web tier is compromised the attacker cannot directly reach the database.` },
    ],
    code:`# Complete architecture in one config
# File structure:
# versions.tf, provider.tf, variables.tf, locals.tf
# networking.tf — VNet, subnets, NSGs
# compute.tf   — LB, VMSS
# data.tf      — SQL Server, Database
# secrets.tf   — Key Vault, secrets, random passwords
# storage.tf   — Storage Account
# outputs.tf   — all outputs

# secrets.tf
resource "random_password" "sql" {
  length = 24; special = true
  keepers = { server = local.prefix }
}
resource "azurerm_key_vault_secret" "sql_password" {
  name         = "sql-admin-password"
  value        = random_password.sql.result
  key_vault_id = azurerm_key_vault.main.id
  depends_on   = [azurerm_role_assignment.kv_tf]
}

# data.tf
resource "azurerm_mssql_server" "main" {
  name                         = "sql-\${local.prefix}-001"
  resource_group_name          = azurerm_resource_group.main.name
  location                     = azurerm_resource_group.main.location
  version                      = "12.0"
  administrator_login          = "sqladmin"
  administrator_login_password = azurerm_key_vault_secret.sql_password.value
  minimum_tls_version          = "1.2"
  tags                         = local.tags
}

# compute.tf — VMSS that reads DB connection string from Key Vault at boot
resource "azurerm_linux_virtual_machine_scale_set" "app" {
  # ... standard VMSS config ...
  identity { type = "SystemAssigned" }

  custom_data = base64encode(<<-EOF
    #!/bin/bash
    az login --identity
    DB_HOST=\$(az keyvault secret show --name sql-server-fqdn --vault-name \${KV_NAME} --query value -o tsv)
    echo "DB_HOST=\$DB_HOST" >> /etc/app.env
  EOF
  )
}

# Grant VMSS managed identity read access to Key Vault
resource "azurerm_role_assignment" "vmss_kv" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_linux_virtual_machine_scale_set.app.identity[0].principal_id
}`,
    codeExplainer:`The VMSS uses a system-assigned managed identity — no credentials stored anywhere. At boot the cloud-init script runs az login --identity (uses the managed identity token) and reads the DB connection string from Key Vault directly. The role assignment grants the VMSS managed identity Secrets User (read-only) access. This is the recommended production pattern for injecting secrets into VMs without any hardcoded credentials.`,
    warnings:[
      "Build each tier in separate Terraform files (networking.tf, compute.tf, data.tf) for readability at this complexity.",
      "Apply in stages during development: network first, then secrets, then data tier, then compute tier.",
      "The VMSS managed identity object_id is only available after the first apply — the role assignment needs depends_on.",
      "SQL Server firewall rules should use private endpoint in production — open firewall rules are a security risk.",
    ],
  },
  lab:{
    intro:"Assemble all previous days' components into a single complete 3-tier infrastructure deployment.",
    steps:[
      { title:"Create the project structure", desc:`New folder: three-tier-app/\n\nCreate files:\n- versions.tf + provider.tf\n- variables.tf + locals.tf\n- networking.tf (VNet, subnets, NSGs from Days 6-7)\n- secrets.tf (Key Vault, random passwords from Day 14)\n- storage.tf (Storage Account from Day 13)\n- data.tf (SQL Server + Database from Day 15)\n- compute.tf (LB + VMSS from Days 9-11)\n- outputs.tf` },
      { title:"Wire secrets into SQL Server", desc:`In secrets.tf:\n- random_password.sql\n- azurerm_key_vault_secret.sql_password storing the result\n\nIn data.tf:\n- administrator_login_password = azurerm_key_vault_secret.sql_password.value\n\nThis creates the dependency: KV must exist before SQL Server can be created.` },
      { title:"Add managed identity to VMSS", desc:`In compute.tf add to the VMSS:\nidentity { type = "SystemAssigned" }\n\nAfter first apply add the role assignment:\nresource "azurerm_role_assignment" "vmss_kv" {\n  scope = azurerm_key_vault.main.id\n  role_definition_name = "Key Vault Secrets User"\n  principal_id = azurerm_linux_virtual_machine_scale_set.app.identity[0].principal_id\n}` },
      { title:"Deploy and verify the full stack", desc:`terraform init\nterraform plan\n\nExpect to see approximately 20–25 resources to create.\n\nterraform apply\n\nVerify in portal:\n- LB public IP is accessible (nginx from VMSS)\n- SQL Database exists and is reachable\n- Key Vault has secrets stored\n- VMSS instances are healthy in LB backend pool` },
      { title:"Test end-to-end connectivity", desc:`From the LB public IP:\ncurl http://LB_PUBLIC_IP → nginx welcome page (app tier responding)\n\nFrom a VMSS instance via Bastion:\naz login --identity (should succeed with managed identity)\naz keyvault secret show --name sql-admin-password --vault-name KV_NAME\n(should return the password — proving managed identity KV access works)` },
    ],
  },
  challenge:{
    task:`Add Azure Monitor diagnostic settings to every major resource (VNet, LB, SQL Database, Key Vault, Storage Account) all pointing to a single Log Analytics Workspace. Create one log collection Terraform resource for each service. Then create a single Azure Monitor dashboard widget (azurerm_portal_dashboard is complex — just create the workspace and diagnostic settings). Output the workspace ID for use in Day 26's Sentinel lab.`,
    hints:[
      `Create azurerm_log_analytics_workspace first — all diagnostic settings reference its ID`,
      `azurerm_monitor_diagnostic_setting for each resource — target_resource_id and log_analytics_workspace_id required`,
      `Each Azure service has different log categories — check the portal for valid category names per resource type`,
      `output "log_analytics_workspace_id" — this ID will be reused in Day 26 Sentinel onboarding`,
    ],
    solution:`resource "azurerm_log_analytics_workspace" "main" {
  name                = "law-\${local.prefix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
  tags                = local.tags
}

resource "azurerm_monitor_diagnostic_setting" "sql" {
  name                       = "sql-diagnostics"
  target_resource_id         = azurerm_mssql_server.main.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  enabled_log { category = "SQLSecurityAuditEvents" }
  metric { category = "Basic" }
}

resource "azurerm_monitor_diagnostic_setting" "kv" {
  name                       = "kv-diagnostics"
  target_resource_id         = azurerm_key_vault.main.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  enabled_log { category = "AuditEvent" }
}

output "log_analytics_workspace_id" {
  value = azurerm_log_analytics_workspace.main.id
}`,
  },
  deepDiveTopics:[
    "Infrastructure as code for existing production systems — migration strategy",
    "Terraform dependency graph — visualising with terraform graph",
    "Managing secrets rotation without service disruption",
    "Blue-green deployments with Terraform and Azure Traffic Manager",
    "Cost estimation — using Infracost with Terraform",
    "Testing Terraform configs — Terratest and policy-as-code",
  ],
},
// ─── DAY 18 ──────────────────────────────────────────────────────────────────
{
  id:18, phase:4, type:"theory",
  title:"Writing Terraform Modules",
  subtitle:"Module structure, input/output variables, calling modules, versioning",
  theory:{
    intro:`Modules are reusable packages of Terraform configuration. Everything you have built so far in a single directory is called the root module. A module is any directory with .tf files — you call it from a root module using a module{} block. Modules enforce consistent patterns, hide complexity, and let you deploy the same infrastructure across dozens of projects without copy-pasting. They are the foundation of enterprise Terraform at scale.`,
    concepts:[
      { title:"Module Structure", body:`A module is a directory with at minimum: main.tf (the resources), variables.tf (input variables — the module's API), and outputs.tf (output values — what the module exposes to callers). Optionally: README.md (required for public registry), versions.tf (provider requirements), and examples/ directory. Every module variable needs a description. Every output needs a description. Treat your module interface like a public API.` },
      { title:"Module Sources", body:`Local path: source = "../modules/networking" — references a directory relative to the root module. Git: source = "git::https://github.com/org/repo.git//modules/networking?ref=v1.2.0" — pin to a tag for stability. Terraform Registry: source = "hashicorp/consul/aws" or your private registry. For internal team modules use a private git repo or a Terraform Cloud private module registry.` },
      { title:"Calling a Module", body:`module "networking" { source = "./modules/networking", var1 = value, var2 = value }. Access module outputs as module.networking.subnet_ids. You cannot access outputs from a module's child resources directly — they must be explicitly declared as outputs in the module's outputs.tf. Each module call creates an isolated namespace — two calls to the same module with different names are completely independent.` },
      { title:"Module Versioning", body:`When sourcing from a registry or git always pin the version: version = "~> 2.0" for registry modules or ?ref=v2.0.0 for git. Never use source without a version in production — a breaking change in the module source will silently break your infrastructure on the next init. For internal modules use semantic versioning tags in your git repo.` },
      { title:"Module Design Principles", body:`Single responsibility: a module should do one thing well (networking, compute, database). Opinionated defaults: provide sensible defaults for most variables so callers only need to pass the values that differ. Composable: modules should not call other modules more than one level deep in most cases. Testable: provide an examples/ directory that deploys a minimal working configuration for testing with terraform validate and plan.` },
    ],
    code:`# modules/networking/variables.tf
variable "prefix" {
  type        = string
  description = "Resource naming prefix e.g. myapp-dev"
}
variable "vnet_address_space" {
  type        = list(string)
  default     = ["10.0.0.0/16"]
  description = "VNet address space CIDR blocks"
}
variable "subnets" {
  type = map(object({ cidr = string, service_endpoints = list(string) }))
  description = "Map of subnet name to config"
}
variable "resource_group_name" { type = string }
variable "location"            { type = string }
variable "tags"                { type = map(string), default = {} }

# modules/networking/main.tf
resource "azurerm_virtual_network" "this" {
  name                = "vnet-\${var.prefix}"
  address_space       = var.vnet_address_space
  location            = var.location
  resource_group_name = var.resource_group_name
  tags                = var.tags
}

resource "azurerm_subnet" "this" {
  for_each             = var.subnets
  name                 = each.key
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.this.name
  address_prefixes     = [each.value.cidr]
  service_endpoints    = each.value.service_endpoints
}

# modules/networking/outputs.tf
output "vnet_id"    { value = azurerm_virtual_network.this.id }
output "vnet_name"  { value = azurerm_virtual_network.this.name }
output "subnet_ids" {
  description = "Map of subnet name to subnet ID"
  value       = { for k, v in azurerm_subnet.this : k => v.id }
}

# root main.tf — calling the module
module "networking" {
  source = "./modules/networking"

  prefix              = local.prefix
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  tags                = local.tags
  subnets = {
    app  = { cidr = "10.0.1.0/24", service_endpoints = ["Microsoft.Storage"] }
    data = { cidr = "10.0.2.0/24", service_endpoints = ["Microsoft.Sql"] }
    mgmt = { cidr = "10.0.3.0/24", service_endpoints = [] }
  }
}

# Use module outputs
output "subnet_ids" { value = module.networking.subnet_ids }`,
    codeExplainer:`Inside the module resources use var.prefix instead of local.prefix — the module has its own variable scope. The module outputs expose subnet_ids as a map. In the root module the call passes variables matching what the module expects. module.networking.subnet_ids accesses the output — the root module never needs to know how subnets are implemented internally, only what the module exposes.`,
    warnings:[
      "Running terraform init is required after adding a new module source even for local modules.",
      "Module variables without defaults are required — callers get an error if they omit them.",
      "Outputs not declared in the module's outputs.tf are inaccessible to the calling config — outputs are the module's public API.",
      "Avoid deeply nested module calls (module calling module calling module) — it makes debugging very difficult.",
    ],
  },
  lab:{
    intro:"Refactor the Day 6 VNet and subnets into a reusable module. Then call it from a root module and verify the outputs are accessible.",
    steps:[
      { title:"Create the module directory structure", desc:`mkdir -p modules/networking\n\nCreate inside modules/networking/:\n- variables.tf (prefix, vnet_address_space, subnets, resource_group_name, location, tags)\n- main.tf (azurerm_virtual_network + azurerm_subnet with for_each)\n- outputs.tf (vnet_id, vnet_name, subnet_ids)\n- README.md (brief description of what the module does and its inputs/outputs)` },
      { title:"Move code into the module", desc:`Take your existing VNet and subnet resources from main.tf and move them into modules/networking/main.tf.\n\nReplace hardcoded local.prefix references with var.prefix.\nReplace azurerm_resource_group.main.name with var.resource_group_name.\nReplace azurerm_resource_group.main.location with var.location.\nReplace local.tags with var.tags.` },
      { title:"Call the module from root", desc:`In your root main.tf:\nmodule "networking" {\n  source = "./modules/networking"\n  prefix              = local.prefix\n  resource_group_name = azurerm_resource_group.main.name\n  location            = azurerm_resource_group.main.location\n  tags                = local.tags\n  subnets             = var.subnets\n}\n\nRun terraform init (required for new module source).` },
      { title:"Update downstream references", desc:`Any resource that previously referenced azurerm_subnet.subnets["app"].id now needs to reference module.networking.subnet_ids["app"].\n\nUpdate NSG associations, VM NIC subnet_id, and any other references.\n\nRun terraform plan — should show no changes if the refactoring is correct (resources already exist with same IDs).` },
      { title:"Validate the module", desc:`terraform validate — checks HCL syntax in all modules\nterraform fmt -check -recursive — checks formatting\nterraform plan — the plan should show 0 changes since same resources exist\n\nIf plan shows destroy+recreate check that your variable values produce the same resource names as before.` },
    ],
  },
  challenge:{
    task:`Create a second module called modules/keyvault that encapsulates Key Vault creation, the Terraform role assignment, and a map of secrets to create. The module should accept a variable secrets = map(string) where keys are secret names and values are the secret values. Output the Key Vault URI and a map of secret_name => secret_id. Call it from root with two secrets.`,
    hints:[
      `variable "secrets" { type = map(string), sensitive = true }`,
      `resource "azurerm_key_vault_secret" "this" { for_each = var.secrets, name = each.key, value = each.value }`,
      `output "secret_ids" { value = { for k, v in azurerm_key_vault_secret.this : k => v.id } }`,
      `In root: module "keyvault" { source = "./modules/keyvault", secrets = { "db-password" = random_password.db.result } }`,
    ],
    solution:`# modules/keyvault/variables.tf
variable "prefix"              { type = string }
variable "resource_group_name" { type = string }
variable "location"            { type = string }
variable "tenant_id"           { type = string }
variable "admin_object_id"     { type = string }
variable "tags"                { type = map(string), default = {} }
variable "secrets" {
  type      = map(string)
  sensitive = true
  default   = {}
}

# modules/keyvault/main.tf
resource "azurerm_key_vault" "this" {
  name                      = "kv-\${var.prefix}-001"
  location                  = var.location
  resource_group_name       = var.resource_group_name
  tenant_id                 = var.tenant_id
  sku_name                  = "standard"
  enable_rbac_authorization = true
  soft_delete_retention_days = 7
  tags = var.tags
}

resource "azurerm_role_assignment" "admin" {
  scope                = azurerm_key_vault.this.id
  role_definition_name = "Key Vault Secrets Officer"
  principal_id         = var.admin_object_id
}

resource "azurerm_key_vault_secret" "this" {
  for_each     = var.secrets
  name         = each.key
  value        = each.value
  key_vault_id = azurerm_key_vault.this.id
  depends_on   = [azurerm_role_assignment.admin]
}

# modules/keyvault/outputs.tf
output "key_vault_id"  { value = azurerm_key_vault.this.id }
output "key_vault_uri" { value = azurerm_key_vault.this.vault_uri }
output "secret_ids"    { value = { for k, v in azurerm_key_vault_secret.this : k => v.id } }`,
  },
  deepDiveTopics:[
    "Terraform Registry — publishing modules publicly and privately",
    "Module testing — Terratest framework for automated module validation",
    "Module composition — when to nest modules and when not to",
    "Input validation in modules — protecting the module's API",
    "Module refactoring — using moved{} blocks to avoid resource recreation",
    "Monorepo vs polyrepo for Terraform modules at enterprise scale",
  ],
},
// ─── DAY 19 ──────────────────────────────────────────────────────────────────
{
  id:19, phase:4, type:"theory",
  title:"Remote State — Azure Blob Backend",
  subtitle:"azurerm backend, state locking, terraform_remote_state data source",
  theory:{
    intro:`Local state (terraform.tfstate on your laptop) is fine for solo development but breaks completely for teams and CI/CD pipelines. If two engineers run apply simultaneously against local state you get conflicting state files and potentially duplicate or destroyed resources. Remote state solves this: state lives in a shared location (Azure Blob Storage), every operation locks the state so only one runner proceeds at a time, and any config can read outputs from any other config via terraform_remote_state.`,
    concepts:[
      { title:"Azure Blob Backend Configuration", body:`The azurerm backend stores state in Azure Blob Storage. Required: resource_group_name, storage_account_name, container_name, and key (the blob name for this state file, e.g. dev/network.tfstate). The storage account and container must exist before running terraform init — Terraform cannot create its own backend. Create them manually or with a separate bootstrap script.` },
      { title:"State Locking", body:`When you run plan or apply Terraform acquires a lease on the Blob — Azure's equivalent of a file lock. If another process tries to run simultaneously it gets an error: Error acquiring the state lock. Run terraform force-unlock LOCK_ID only if you are certain the previous run is dead (e.g. a pipeline crashed). Never force-unlock while another legitimate run is in progress — you will corrupt state.` },
      { title:"Backend Authentication", body:`The azurerm backend authenticates separately from the azurerm provider. Options: use_azuread_auth = true (recommended, uses same service principal env vars as the provider), SAS token (use_sas_token_auth = true), access key (use_authentication = "azurerm_sas" or just storage account access key in ARM_ACCESS_KEY env var). Never put the access key in the backend config block — use environment variables.` },
      { title:"terraform_remote_state Data Source", body:`Reads outputs from another Terraform config's state file. Use case: your networking config outputs subnet IDs, your compute config reads them via remote_state instead of hardcoding. Configuration: data "terraform_remote_state" "network" { backend = "azurerm", config = { storage_account_name = "...", container_name = "...", key = "network.tfstate" } }. Access outputs as data.terraform_remote_state.network.outputs.subnet_ids.` },
      { title:"State File Organisation", body:`One pattern: separate state files per environment and per component. dev/network.tfstate, dev/compute.tfstate, prod/network.tfstate, prod/compute.tfstate. Each is a separate terraform init with a different backend key. Advantages: smaller state files, isolated blast radius, faster plans. Disadvantage: more configs to manage. The alternative is one state file per environment which is simpler but has larger blast radius.` },
    ],
    code:`# 1. Bootstrap script (run once, manually — not in Terraform)
# az group create --name rg-tfstate --location eastus
# az storage account create --name stterraformstate001 --resource-group rg-tfstate --sku Standard_LRS
# az storage container create --name tfstate --account-name stterraformstate001

# 2. backend.tf — configure remote state
terraform {
  backend "azurerm" {
    resource_group_name  = "rg-tfstate"
    storage_account_name = "stterraformstate001"
    container_name       = "tfstate"
    key                  = "dev/three-tier-app.tfstate"
    use_azuread_auth     = true
  }
}

# 3. Migrate from local to remote state
# terraform init -migrate-state
# Terraform asks: "Do you want to copy existing state to the new backend?"
# Type: yes

# 4. Separate configs reading each other via remote_state
# In compute.tf reading from a separate network config:
data "terraform_remote_state" "network" {
  backend = "azurerm"
  config = {
    resource_group_name  = "rg-tfstate"
    storage_account_name = "stterraformstate001"
    container_name       = "tfstate"
    key                  = "dev/network.tfstate"
    use_azuread_auth     = true
  }
}

# Use the remote state output
resource "azurerm_network_interface" "vm" {
  # ...
  ip_configuration {
    name      = "internal"
    subnet_id = data.terraform_remote_state.network.outputs.subnet_ids["app"]
  }
}`,
    codeExplainer:`use_azuread_auth = true means the backend uses the same Azure AD authentication as the provider (ARM_* env vars or CLI) — no separate storage account key needed. The key value is the blob path within the container — using a path like dev/three-tier-app.tfstate organises multiple state files in one container. After migration run terraform state list to verify state was transferred successfully.`,
    warnings:[
      "Create the storage account and container BEFORE running terraform init with the azurerm backend — init cannot create them.",
      "Enable versioning on the state container blob: az storage blob service-properties update --enable-versioning true",
      "Never delete the state blob — it is your infrastructure's source of truth. Enable soft delete on the container.",
      "Backend configuration cannot use variables or locals — all values must be literal strings.",
    ],
  },
  lab:{
    intro:"Migrate the Day 17 project's local state to Azure Blob Storage and configure state locking.",
    steps:[
      { title:"Bootstrap the state storage account", desc:`Run these commands once in terminal:\n\naz group create --name rg-tfstate-learn --location eastus\n\naz storage account create \\\n  --name stterraformlearn001 \\\n  --resource-group rg-tfstate-learn \\\n  --sku Standard_LRS\n\naz storage container create \\\n  --name tfstate \\\n  --account-name stterraformlearn001\n\nEnable blob versioning:\naz storage account blob-service-properties update \\\n  --account-name stterraformlearn001 \\\n  --enable-versioning true` },
      { title:"Add backend.tf to Day 17 project", desc:`Create backend.tf:\nterraform {\n  backend "azurerm" {\n    resource_group_name  = "rg-tfstate-learn"\n    storage_account_name = "stterraformlearn001"\n    container_name       = "tfstate"\n    key                  = "dev/three-tier-app.tfstate"\n    use_azuread_auth     = true\n  }\n}` },
      { title:"Migrate state", desc:`terraform init -migrate-state\n\nTerraform detects local state and asks if you want to migrate:\n"Do you want to copy existing state to the new backend?"\n\nType: yes\n\nTerraform uploads your local state to Azure Blob and deletes the local terraform.tfstate.` },
      { title:"Verify remote state", desc:`Check the blob exists:\naz storage blob list \\\n  --container-name tfstate \\\n  --account-name stterraformlearn001 \\\n  --auth-mode login\n\nYou should see dev/three-tier-app.tfstate listed.\n\nRun terraform state list — should return the same resources as before migration.` },
      { title:"Test state locking", desc:`Open two terminals in the same Terraform directory.\n\nIn terminal 1: start a slow apply: terraform apply -auto-approve &\n\nIn terminal 2 immediately: terraform plan\n\nTerminal 2 should show:\nError: Error acquiring the state lock\n\nThis proves locking is working — only one operation runs at a time.` },
    ],
  },
  challenge:{
    task:`Create a new separate Terraform config (new folder) that reads the three-tier-app state outputs via terraform_remote_state and deploys an Azure Monitor alert based on the SQL Server FQDN output from the main config. The new config should have its own state file at dev/monitoring.tfstate. Prove the decoupled architecture works by deploying the monitoring config independently.`,
    hints:[
      `Create a new folder: monitoring/ with its own backend.tf pointing to key = "dev/monitoring.tfstate"`,
      `data "terraform_remote_state" "app" pointing to key = "dev/three-tier-app.tfstate"`,
      `data.terraform_remote_state.app.outputs.sql_server_fqdn gives you the SQL FQDN`,
      `Create an azurerm_monitor_metric_alert targeting the SQL server using its ID from remote state`,
    ],
    solution:`# monitoring/backend.tf
terraform {
  backend "azurerm" {
    resource_group_name  = "rg-tfstate-learn"
    storage_account_name = "stterraformlearn001"
    container_name       = "tfstate"
    key                  = "dev/monitoring.tfstate"
    use_azuread_auth     = true
  }
}

# monitoring/main.tf
data "terraform_remote_state" "app" {
  backend = "azurerm"
  config = {
    resource_group_name  = "rg-tfstate-learn"
    storage_account_name = "stterraformlearn001"
    container_name       = "tfstate"
    key                  = "dev/three-tier-app.tfstate"
    use_azuread_auth     = true
  }
}

resource "azurerm_monitor_metric_alert" "sql_dtu" {
  name                = "sql-high-dtu"
  resource_group_name = data.terraform_remote_state.app.outputs.resource_group_name
  scopes              = [data.terraform_remote_state.app.outputs.sql_database_id]
  criteria {
    metric_namespace = "Microsoft.Sql/servers/databases"
    metric_name      = "dtu_consumption_percent"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 80
  }
}`,
  },
  deepDiveTopics:[
    "Terraform state encryption — customer-managed keys for state blobs",
    "State file organisation patterns — per-env vs per-component",
    "Recovering from corrupted state — using terraform state commands",
    "State backend migration — moving between backends without data loss",
    "Atlantis and Terraform Cloud — automated remote plan and apply",
    "State dependencies vs module dependencies — choosing the right pattern",
  ],
},
// ─── DAY 20 ──────────────────────────────────────────────────────────────────
{
  id:20, phase:4, type:"theory",
  title:"Terraform Workspaces",
  subtitle:"terraform workspace commands, workspace-aware variables, use cases",
  theory:{
    intro:`Terraform workspaces let you maintain multiple distinct state files from the same configuration directory. Instead of running terraform apply -var-file=dev.tfvars and terraform apply -var-file=prod.tfvars with potentially separate state files, workspaces let you switch context with terraform workspace select dev or prod and the state is automatically isolated. Understanding when workspaces help and when they are the wrong tool is as important as knowing how to use them.`,
    concepts:[
      { title:"How Workspaces Work", body:`By default you are in the default workspace. Create new workspaces with terraform workspace new dev. List them with terraform workspace list. Switch with terraform workspace select prod. Each workspace gets its own state file in the same backend — for the Azure Blob backend states are stored as env:/dev/three-tier-app.tfstate and env:/prod/three-tier-app.tfstate automatically. The default workspace uses the key you specified without the env:/ prefix.` },
      { title:"Workspace-aware Configuration", body:`Reference the current workspace name as terraform.workspace anywhere in your HCL. Use it in locals: environment = terraform.workspace. Use it in variable lookups: var.settings[terraform.workspace]. Use it in resource names: "rg-myapp-\${terraform.workspace}". This lets a single configuration deploy appropriately for whichever workspace is active without using -var-file flags.` },
      { title:"Per-workspace Variable Maps", body:`A powerful pattern: define a variable as a map with workspace names as keys. local.settings = var.workspace_config[terraform.workspace]. Then var.workspace_config["dev"] contains dev-specific values and var.workspace_config["prod"] contains prod-specific values. All environment-specific differences live in one variable map making it easy to see differences across environments.` },
      { title:"Workspaces vs Separate Directories", body:`Workspaces are NOT the right tool when: environments have fundamentally different architectures (different resources), different teams own different environments, you need strict access control between environments. Workspaces ARE appropriate when: you have identical infrastructure for dev and prod differing only in size/count, you want to quickly spin up a feature branch environment, you are doing a single-person or small team project. HashiCorp recommends separate directories with shared modules for production multi-environment setups.` },
      { title:"Workspace Limitations", body:`Cannot have different providers per workspace. Cannot have different backend configurations per workspace. If you delete a workspace its state is gone — no trash. You cannot terraform workspace delete if there are resources in the state. Workspace names are case-sensitive. The default workspace cannot be deleted. These limitations explain why large organisations often prefer the separate-directory pattern over workspaces.` },
    ],
    code:`# terraform workspace commands
# terraform workspace list        — list all workspaces (* = current)
# terraform workspace new dev     — create and switch to dev
# terraform workspace new prod    — create and switch to prod
# terraform workspace select dev  — switch to existing workspace
# terraform workspace show        — show current workspace name
# terraform workspace delete dev  — delete workspace (must be empty)

# Using terraform.workspace in HCL
locals {
  environment = terraform.workspace
  prefix      = "myapp-\${terraform.workspace}"

  # Per-workspace config map
  workspace_config = {
    dev  = { vm_size = "Standard_B2s",   sql_sku = "S1",        min_instances = 1 }
    prod = { vm_size = "Standard_D4s_v3", sql_sku = "GP_Gen5_4", min_instances = 3 }
  }

  # Fail fast if unknown workspace
  config = lookup(local.workspace_config, terraform.workspace, null)
}

# Validation to prevent running in unsupported workspace
resource "null_resource" "workspace_check" {
  lifecycle {
    precondition {
      condition     = contains(keys(local.workspace_config), terraform.workspace)
      error_message = "Workspace \${terraform.workspace} not configured. Use: dev or prod."
    }
  }
}

# Resources use workspace-specific values
resource "azurerm_linux_virtual_machine_scale_set" "app" {
  # ...
  sku       = local.config.vm_size
  instances = local.config.min_instances
}

resource "azurerm_mssql_database" "app" {
  # ...
  sku_name = local.config.sql_sku
}

# Workspace-aware output
output "current_environment" {
  value = "Deployed to: \${terraform.workspace}"
}`,
    codeExplainer:`local.workspace_config is a map with workspace names as keys and environment-specific settings as values. lookup() retrieves the config for the current workspace and fails gracefully if an unknown workspace is used. The null_resource with precondition is a guard — it prevents accidental deployments to misconfigured workspaces. This entire pattern replaces separate .tfvars files while keeping all environment differences in one visible place.`,
    warnings:[
      "terraform workspace delete removes the state permanently — ensure terraform destroy ran first.",
      "Workspaces share the same provider configuration — you cannot use different subscriptions per workspace easily.",
      "The default workspace has no env:/ prefix in state path — be aware when inspecting blob storage.",
      "terraform.workspace in module code makes the module less reusable — prefer passing environment as a variable.",
    ],
  },
  lab:{
    intro:"Convert the Day 18 module-based config to use workspaces for dev and prod environments instead of .tfvars files.",
    steps:[
      { title:"Create workspace config map", desc:`Replace your variables.tf environment variable with a local workspace_config map:\n\nlocals {\n  workspace_config = {\n    dev  = { vm_size = "Standard_B2s", replication = "LRS", instances = 1 }\n    prod = { vm_size = "Standard_D2s_v3", replication = "ZRS", instances = 3 }\n  }\n  config = local.workspace_config[terraform.workspace]\n}` },
      { title:"Create workspaces", desc:`terraform workspace new dev\nterraform workspace new prod\n\nterraform workspace list\n# Output:\n#   default\n# * dev\n#   prod\n\nYou are now in the dev workspace.` },
      { title:"Deploy to dev workspace", desc:`terraform workspace select dev\nterraform apply\n\nVerify the dev workspace uses Standard_B2s VMs and LRS storage.\n\nIn Azure portal: resource names should contain "dev" from local.prefix = "myapp-\${terraform.workspace}"` },
      { title:"Deploy to prod workspace", desc:`terraform workspace select prod\nterraform apply\n\nVerify prod uses Standard_D2s_v3 VMs and ZRS storage.\n\nBoth dev and prod environments exist simultaneously — completely isolated state files.` },
      { title:"Inspect workspace state files", desc:`List blobs in the tfstate container:\naz storage blob list --container-name tfstate --account-name stterraformlearn001 --auth-mode login\n\nYou should see:\n- three-tier-app.tfstate (default workspace)\n- env:/dev/three-tier-app.tfstate\n- env:/prod/three-tier-app.tfstate\n\nEach is a completely separate state file.` },
    ],
  },
  challenge:{
    task:`Create a staging workspace between dev and prod with its own configuration: Standard_B4ms VMs, ZRS storage, 2 minimum instances. Then write a local expression that computes a cost_tier string — "low" for dev, "medium" for staging, "high" for prod — and output it. Test all three workspaces and verify the correct cost_tier appears in each.`,
    hints:[
      `Add staging to workspace_config map with its own settings`,
      `cost_tier map: dev="low", staging="medium", prod="high"`,
      `local.cost_tier = lookup({ dev="low", staging="medium", prod="high" }, terraform.workspace, "unknown")`,
      `terraform workspace select staging && terraform apply to test`,
    ],
    solution:`locals {
  workspace_config = {
    dev     = { vm_size = "Standard_B2s",   replication = "LRS", instances = 1 }
    staging = { vm_size = "Standard_B4ms",  replication = "ZRS", instances = 2 }
    prod    = { vm_size = "Standard_D2s_v3", replication = "ZRS", instances = 3 }
  }
  config    = local.workspace_config[terraform.workspace]
  cost_tier = lookup({ dev = "low", staging = "medium", prod = "high" }, terraform.workspace, "unknown")
}

output "cost_tier" {
  value = "Environment \${terraform.workspace} cost tier: \${local.cost_tier}"
}`,
  },
  deepDiveTopics:[
    "Workspaces vs directories — HashiCorp's official guidance",
    "Feature branch environments — ephemeral workspace patterns",
    "Workspace-aware remote state — accessing outputs from other workspaces",
    "Terramate and Terragrunt — workspace alternatives for large teams",
    "Destroying workspace resources safely — cleanup automation",
    "CI/CD with workspaces — GitHub Actions matrix strategy",
  ],
},
// ─── DAY 21 ──────────────────────────────────────────────────────────────────
{
  id:21, phase:4, type:"theory",
  title:"HCP Terraform Cloud",
  subtitle:"Remote runs, variable sets, VCS integration, policy enforcement",
  theory:{
    intro:`HCP Terraform (formerly Terraform Cloud) is HashiCorp's managed platform for running Terraform in a controlled, collaborative environment. Instead of running terraform apply on your laptop it runs in a managed container in HashiCorp's infrastructure, with full audit logging, team access controls, and a UI for reviewing plans before approving. For any team beyond one person it dramatically improves safety and visibility.`,
    concepts:[
      { title:"HCP Terraform Architecture", body:`Workspaces in HCP Terraform are different from CLI workspaces — they are full projects with their own VCS connection, variables, run history, state, and team permissions. An organisation contains workspaces. Each workspace connects to a git repo (or uses CLI-driven runs) and triggers a plan on every push. The plan is displayed in the UI — a human approves it before apply runs. State is stored and managed by HCP Terraform — no backend configuration needed.` },
      { title:"Remote Runs", body:`In remote execution mode Terraform operations run on HCP Terraform's infrastructure, not your local machine. This means: consistent environment (same Terraform version for every run), audit log of every plan and apply, no credentials on developer laptops (credentials live in workspace variables), and notifications on plan results. Configure with: terraform { cloud { organization = "my-org", workspaces { name = "my-workspace" } } }` },
      { title:"Variable Sets", body:`Variable sets are reusable collections of variables applied to multiple workspaces. Create an Azure credentials variable set with ARM_CLIENT_ID, ARM_CLIENT_SECRET, ARM_TENANT_ID, ARM_SUBSCRIPTION_ID marked as sensitive and apply it to every Azure workspace. Developers never see the credentials — they just know their workspace will authenticate to Azure. Change the credentials once in the variable set and all workspaces update.` },
      { title:"VCS Integration", body:`Connect a workspace to a GitHub/GitLab/Azure DevOps repo. HCP Terraform installs a webhook. On every pull request it runs terraform plan and posts the result as a PR check — reviewers can see what infrastructure changes the PR includes before merging. On merge to main it runs terraform apply automatically. This implements GitOps for infrastructure with the same workflow developers use for application code.` },
      { title:"Sentinel Policies", body:`Sentinel is HCP Terraform's policy-as-code framework. Write policies in the Sentinel language that run between plan and apply. Examples: deny any resource without required tags, block creation of VMs over a certain size, require all storage accounts to have https-only enabled. Policy failures block apply until a privileged user overrides. Available on Terraform Plus and higher tiers.` },
    ],
    code:`# terraform block for HCP Terraform (replaces backend block)
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    azurerm = { source = "hashicorp/azurerm", version = "~> 3.85" }
  }

  cloud {
    organization = "my-org-name"
    workspaces {
      name = "azure-learn-dev"
      # OR use tags to dynamically select workspaces:
      # tags = ["azure", "dev"]
    }
  }
}

# .terraformrc — authenticate the CLI with HCP Terraform
# credentials "app.terraform.io" {
#   token = "YOUR_API_TOKEN"
# }
# Or set: export TF_TOKEN_app_terraform_io="YOUR_TOKEN"

# Trigger a run from CLI:
# terraform login         — opens browser to authenticate
# terraform init          — connects to HCP workspace
# terraform plan          — submits a speculative plan (UI review)
# terraform apply         — submits plan+apply run (awaits approval)

# Variable sets — set these in the HCP UI for each workspace:
# ARM_CLIENT_ID       = your SP app ID     (sensitive)
# ARM_CLIENT_SECRET   = your SP password   (sensitive)
# ARM_TENANT_ID       = your tenant GUID   (sensitive)
# ARM_SUBSCRIPTION_ID = your sub GUID      (sensitive)

# Example Sentinel policy (enforces required tags):
# import "tfplan/v2" as tfplan
#
# required_tags = ["environment", "managed_by", "project"]
#
# deny_resources_without_tags = rule {
#   all tfplan.resource_changes as _, rc {
#     rc.mode is "managed" and rc.change.actions contains "create"
#       implies all required_tags as tag {
#         rc.change.after.tags[tag] is not null
#       }
#   }
# }
#
# main = rule { deny_resources_without_tags }`,
    codeExplainer:`The cloud{} block replaces the backend{} block entirely — HCP Terraform manages state automatically. terraform login opens a browser to get an API token. After that terraform init connects the local directory to the HCP workspace. Any terraform plan or apply you run submits a remote run to HCP — you see the output streamed back to your terminal but the actual execution happens in HCP's infrastructure.`,
    warnings:[
      "The cloud{} block and backend{} block are mutually exclusive — you cannot use both.",
      "terraform login stores the API token in ~/.terraform.d/credentials.tfrc.json — protect this file.",
      "HCP Terraform free tier allows 500 managed resources per month — sufficient for learning.",
      "Remote runs require all variables to be set in the HCP workspace — local env vars are NOT passed to remote runs.",
    ],
  },
  lab:{
    intro:"Set up an HCP Terraform account, connect a workspace to your GitHub repo, and run a plan and apply remotely.",
    steps:[
      { title:"Create HCP Terraform account", desc:`Go to app.terraform.io and create a free account.\n\nCreate an organisation (e.g. yourname-learn).\n\nCreate a workspace named azure-learn-dev.\n\nSelect CLI-driven workflow for now (you can add VCS later).` },
      { title:"Authenticate the CLI", desc:`terraform login\n\nThis opens a browser at app.terraform.io/app/settings/tokens.\nCreate an API token and paste it in the terminal prompt.\n\nOr set environment variable:\nexport TF_TOKEN_app_terraform_io="your-token"\n\nVerify: the token is saved to ~/.terraform.d/credentials.tfrc.json` },
      { title:"Update terraform block", desc:`Replace your backend "azurerm" block with:\nterraform {\n  cloud {\n    organization = "yourname-learn"\n    workspaces {\n      name = "azure-learn-dev"\n    }\n  }\n}\n\nRun terraform init — Terraform migrates local state to HCP Terraform automatically.` },
      { title:"Configure Azure credentials in HCP", desc:`In app.terraform.io → workspace azure-learn-dev → Variables tab\n\nAdd Environment Variables (sensitive):\n- ARM_CLIENT_ID\n- ARM_CLIENT_SECRET\n- ARM_TENANT_ID\n- ARM_SUBSCRIPTION_ID\n\nMark each as Sensitive — they will not be shown in the UI after saving.` },
      { title:"Run plan and apply", desc:`terraform plan\n\nOutput streams to your terminal but runs in HCP.\nOpen app.terraform.io to see the run in the UI.\n\nterraform apply\n\nHCP runs the plan and waits for your confirmation in the UI.\nApprove it in the browser — apply runs remotely in HCP infrastructure.` },
    ],
  },
  challenge:{
    task:`Connect the HCP workspace to your GitHub repo using VCS-driven workflow. Configure it so that any push to the main branch triggers terraform plan automatically and any pull request shows the plan as a PR check. Test it by making a small change (adding a tag) and pushing it — verify the plan appears in the GitHub PR checks.`,
    hints:[
      `In HCP workspace settings → Version Control → connect to GitHub via OAuth`,
      `Set the VCS branch to main and the working directory if your Terraform is in a subdirectory`,
      `HCP installs a webhook in your GitHub repo automatically`,
      `Create a PR with a minor change and check the Checks tab in GitHub — HCP Terraform should appear`,
    ],
    solution:`# Steps (UI-based — no .tf code required):
# 1. app.terraform.io → workspace → Settings → Version Control
# 2. Click "Connect to version control"
# 3. Choose GitHub → authorize the HCP Terraform GitHub app
# 4. Select your repository
# 5. Set Terraform Working Directory if needed (e.g. "three-tier-app/")
# 6. Set VCS Branch to "main"
# 7. Enable "Automatic speculative plans" for PRs
# 8. Save settings
#
# To test:
# git checkout -b add-tag
# (add a tag to locals in locals.tf)
# git add . && git commit -m "test: add cost-center tag"
# git push origin add-tag
# (create PR in GitHub)
# GitHub Checks tab should show "HCP Terraform" check running`,
  },
  deepDiveTopics:[
    "HCP Terraform agents — running plans in your own network",
    "Sentinel policies — writing and testing custom policies",
    "Run triggers — automatically triggering downstream workspaces",
    "Team permissions — fine-grained access control in HCP",
    "Audit logging — HCP Terraform audit trail for compliance",
    "Cost estimation — per-run cost estimates in HCP Terraform",
  ],
},
// ─── DAY 22 ──────────────────────────────────────────────────────────────────
{
  id:22, phase:4, type:"project",
  title:"PROJECT — Multi-env Module Library",
  subtitle:"Reusable module library deployed to dev and prod with full separation",
  theory:{
    intro:`Today you build a proper module library — a set of reusable, tested modules that can be composed to deploy any environment. You will create networking, compute, keyvault, and database modules, then use them in separate dev and prod root configurations that share the same modules but have their own state files, variable values, and potentially different resource configurations. This is the architecture pattern used in real enterprise Terraform codebases.`,
    concepts:[
      { title:"Module Library Structure", body:`A mature module library lives in a dedicated repo or a modules/ directory: modules/networking (VNet, subnets, NSGs), modules/compute (VMSS, LB), modules/keyvault (KV, role assignments, secrets), modules/database (SQL Server, database, firewall rules), modules/storage (Storage Account, containers, lifecycle). Each module has its own variables.tf, main.tf, outputs.tf, and README.md. Root configurations in environments/dev/ and environments/prod/ call these modules.` },
      { title:"Root Module Composition", body:`Each environment's root module (environments/dev/main.tf) calls the shared modules with environment-specific inputs. The modules are version-pinned (ref=v1.2.0 for git sources) so dev and prod can use different module versions during staged rollouts. The environment root modules have their own backend configuration pointing to different state file keys: dev/main.tfstate vs prod/main.tfstate.` },
      { title:"Module Versioning with Tags", body:`Tag your module git repo at stable points: git tag v1.0.0 && git push --tags. Reference in root module: source = "git::https://github.com/org/modules.git//networking?ref=v1.0.0". When you improve a module release v1.1.0. Dev environment can update to v1.1.0 while prod stays on v1.0.0 — test the new module in dev before promoting to prod. This gives you a controlled, safe update pathway.` },
      { title:"Testing Your Modules", body:`Minimum testing: run terraform validate and terraform fmt -check in CI on every PR. Next level: terratest (Go-based automated testing — actually deploys and destroys real resources). Simplest practical approach: maintain an examples/ directory in each module that deploys a minimal working version, run terraform apply in a sandbox subscription on PRs and destroy after the tests pass.` },
    ],
    code:`# Repository structure for a module library
# modules/
# ├── networking/
# │   ├── main.tf, variables.tf, outputs.tf, README.md
# ├── compute/
# │   ├── main.tf, variables.tf, outputs.tf, README.md
# ├── keyvault/
# │   ├── main.tf, variables.tf, outputs.tf, README.md
# └── database/
#     ├── main.tf, variables.tf, outputs.tf, README.md
#
# environments/
# ├── dev/
# │   ├── backend.tf (key = dev/main.tfstate)
# │   ├── versions.tf + provider.tf
# │   ├── variables.tf, locals.tf
# │   └── main.tf (calls modules with dev-specific values)
# └── prod/
#     ├── backend.tf (key = prod/main.tfstate)
#     ├── versions.tf + provider.tf
#     ├── variables.tf, locals.tf
#     └── main.tf (calls modules with prod-specific values)

# environments/dev/main.tf
module "networking" {
  source = "../../modules/networking"
  prefix              = local.prefix
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  vnet_address_space  = ["10.0.0.0/16"]
  subnets             = var.subnets
  tags                = local.tags
}

module "keyvault" {
  source = "../../modules/keyvault"
  prefix              = local.prefix
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  tenant_id           = data.azurerm_client_config.current.tenant_id
  admin_object_id     = data.azurerm_client_config.current.object_id
  tags                = local.tags
}

module "database" {
  source = "../../modules/database"
  prefix              = local.prefix
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sql_password        = module.keyvault.secret_values["sql-password"]
  environment         = var.environment
  tags                = local.tags
}

module "compute" {
  source = "../../modules/compute"
  prefix              = local.prefix
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  subnet_id           = module.networking.subnet_ids["app"]
  vm_size             = var.vm_size
  min_instances       = var.min_instances
  key_vault_id        = module.keyvault.key_vault_id
  tags                = local.tags
}`,
    codeExplainer:`Each module call passes only the values that differ between environments — shared defaults are handled inside the module. module.keyvault.secret_values["sql-password"] passes a generated secret from the keyvault module directly to the database module — the root config orchestrates the data flow between modules without the modules knowing about each other.`,
    warnings:[
      "Run terraform init in both environments/dev and environments/prod — they are separate root modules.",
      "Module outputs must be explicitly declared — the caller cannot access internal resources directly.",
      "When refactoring existing code into modules use terraform state mv to avoid destroy+recreate.",
      "Module validation with validate runs recursively — a syntax error in any module fails the root module init.",
    ],
  },
  lab:{
    intro:"Build the complete module library and deploy it to both dev and prod environments with separate state files.",
    steps:[
      { title:"Create the module library", desc:`Create all 4 modules:\nmkdir -p modules/{networking,compute,keyvault,database}\n\nMove existing code from Days 6-17 into the appropriate modules. Replace all local.xxx references with var.xxx inside each module.\n\nCreate outputs.tf in each module exposing all values other modules need.` },
      { title:"Create environment directories", desc:`mkdir -p environments/{dev,prod}\n\nEach environment gets:\n- backend.tf (different keys: dev/main.tfstate and prod/main.tfstate)\n- provider.tf + versions.tf\n- variables.tf (environment-specific values)\n- locals.tf (prefix = "myapp-\${var.environment}")\n- main.tf (calls all 4 modules)` },
      { title:"Deploy dev environment", desc:`cd environments/dev\nterraform init\nterraform apply\n\nVerify all resources create successfully with dev naming convention.\n\nRun terraform output to see all outputs from the environment.\n\nCheck that state is at dev/main.tfstate in your Blob container.` },
      { title:"Deploy prod environment", desc:`cd environments/prod\nterraform init\nterraform apply\n\nProd should deploy with different VM sizes, ZRS storage, and purge_protection enabled on Key Vault.\n\nVerify in portal that dev and prod resources exist simultaneously with no conflicts.` },
      { title:"Test module update isolation", desc:`Make a non-breaking change to modules/networking (add a tag output).\n\ncd environments/dev && terraform plan\n→ shows the new output, no resource changes\n\ncd environments/prod && terraform plan\n→ same result — both environments pick up the module change independently.` },
    ],
  },
  challenge:{
    task:`Add a validation module (modules/validation) that uses null_resource with precondition to enforce: (1) all resource names contain the environment name, (2) production deployments require zone_redundant = true on the database, (3) no Standard_B series VMs allowed in prod. Call this module from both environment root modules and verify it blocks invalid configurations with clear error messages.`,
    hints:[
      `null_resource with lifecycle { precondition { condition = ..., error_message = ... } } blocks apply if condition is false`,
      `Pass variables to the validation module: environment, vm_size, zone_redundant`,
      `condition for prod zone check: !(var.environment == "prod") || var.zone_redundant == true`,
      `condition for VM size in prod: !(var.environment == "prod") || !startswith(var.vm_size, "Standard_B")`,
    ],
    solution:`# modules/validation/main.tf
variable "environment"    { type = string }
variable "vm_size"        { type = string }
variable "zone_redundant" { type = bool }

resource "null_resource" "prod_zone_check" {
  lifecycle {
    precondition {
      condition     = !(var.environment == "prod") || var.zone_redundant == true
      error_message = "Production deployments require zone_redundant = true."
    }
  }
}

resource "null_resource" "prod_vm_size_check" {
  lifecycle {
    precondition {
      condition     = !(var.environment == "prod") || !startswith(var.vm_size, "Standard_B")
      error_message = "Standard_B series VMs are not allowed in production. Use Standard_D or higher."
    }
  }
}`,
  },
  deepDiveTopics:[
    "Terraform module registry — publishing to the public registry",
    "Semantic versioning for infrastructure modules",
    "Terratest — automated integration testing for Terraform modules",
    "Module composition patterns — avoiding over-abstraction",
    "Breaking changes in modules — safe upgrade paths",
    "Private module registry — Terraform Cloud and Artifactory",
  ],
},
// ─── DAY 23 ──────────────────────────────────────────────────────────────────
{
  id:23, phase:5, type:"advanced",
  title:"Azure Kubernetes Service (AKS)",
  subtitle:"AKS cluster, node pools, RBAC, managed identity, CNI networking",
  theory:{
    intro:`Azure Kubernetes Service (AKS) is Azure's managed Kubernetes offering. Azure manages the control plane (API server, etcd, scheduler) for free — you only pay for worker nodes. In Terraform an AKS cluster is a single resource but it has many configuration options: network plugin, RBAC, managed identity, monitoring, node pool sizing. Getting these right from day one avoids painful migrations later.`,
    concepts:[
      { title:"AKS Cluster Components", body:`azurerm_kubernetes_cluster is the main resource. It includes: default_node_pool (the system node pool — required, runs system pods like CoreDNS), identity (managed identity for the cluster), network_profile (CNI and network policy), azure_active_directory_role_based_access_control (Entra ID RBAC integration). Additional user node pools use the separate azurerm_kubernetes_cluster_node_pool resource.` },
      { title:"Network Plugins", body:`kubenet: simple overlay network, Azure assigns pod IPs from a separate range not visible in the VNet. Suitable for small clusters. Azure CNI: each pod gets a real VNet IP — pods are first-class VNet citizens, reachable by NSGs and peered VNets. Required for advanced networking features. Azure CNI Overlay: pods get IPs from an overlay (saves VNet IPs) but still integrate with VNet routing — the best of both worlds for large clusters.` },
      { title:"Managed Identity for AKS", body:`Always use managed identity (identity { type = "SystemAssigned" }) instead of a service principal. The cluster's managed identity needs two role assignments: Network Contributor on the VNet subnet (to configure load balancer and IPs) and AcrPull on any Container Registry if you pull images from ACR. With managed identity there are no credentials to rotate — Azure handles it automatically.` },
      { title:"Node Pools", body:`System node pool: runs Kubernetes system components, should use Standard_D2s_v3 minimum, use taints to prevent user workloads. User node pools (azurerm_kubernetes_cluster_node_pool): separate pools for different workload types, support autoscaling, can use spot instances for cost savings, can be in different availability zones. Enable_auto_scaling with min_count and max_count for elastic workloads.` },
      { title:"AKS RBAC with Entra ID", body:`Set azure_active_directory_role_based_access_control { managed = true, azure_rbac_enabled = true }. This integrates Kubernetes RBAC with Azure RBAC — kubectl access is controlled by Azure role assignments. Built-in roles: Azure Kubernetes Service Cluster Admin Role (full access), Azure Kubernetes Service Cluster User Role (kubeconfig access), Azure Kubernetes Service RBAC Reader/Writer/Admin/Cluster Admin.` },
    ],
    code:`resource "azurerm_kubernetes_cluster" "main" {
  name                = "aks-\${local.prefix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  dns_prefix          = "aks-\${local.prefix}"
  kubernetes_version  = var.kubernetes_version
  sku_tier            = var.environment == "prod" ? "Standard" : "Free"

  default_node_pool {
    name                = "system"
    node_count          = var.environment == "prod" ? 3 : 1
    vm_size             = "Standard_D2s_v3"
    vnet_subnet_id      = azurerm_subnet.subnets["aks"].id
    enable_auto_scaling = var.environment == "prod"
    min_count           = var.environment == "prod" ? 2 : null
    max_count           = var.environment == "prod" ? 5 : null
    os_disk_type        = "Ephemeral"
    node_labels         = { "nodepool-type" = "system" }
  }

  identity { type = "SystemAssigned" }

  network_profile {
    network_plugin     = "azure"
    network_policy     = "calico"
    dns_service_ip     = "10.2.0.10"
    service_cidr       = "10.2.0.0/16"
    load_balancer_sku  = "standard"
  }

  azure_active_directory_role_based_access_control {
    managed            = true
    azure_rbac_enabled = true
  }

  oms_agent {
    log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  }

  tags = local.tags
}

# User node pool for workloads (separate from system pool)
resource "azurerm_kubernetes_cluster_node_pool" "workload" {
  name                  = "workload"
  kubernetes_cluster_id = azurerm_kubernetes_cluster.main.id
  vm_size               = "Standard_D4s_v3"
  enable_auto_scaling   = true
  min_count             = 1
  max_count             = 10
  vnet_subnet_id        = azurerm_subnet.subnets["aks"].id
  node_taints           = []
  tags                  = local.tags
}

# Grant AKS managed identity Network Contributor on subnet
resource "azurerm_role_assignment" "aks_network" {
  scope                = azurerm_subnet.subnets["aks"].id
  role_definition_name = "Network Contributor"
  principal_id         = azurerm_kubernetes_cluster.main.identity[0].principal_id
}

output "kube_config" {
  value     = azurerm_kubernetes_cluster.main.kube_config_raw
  sensitive = true
}
output "aks_cluster_name" { value = azurerm_kubernetes_cluster.main.name }`,
    codeExplainer:`os_disk_type = "Ephemeral" stores the OS disk in VM cache — faster boot, no extra disk cost, disk disappears when node is replaced (fine for stateless Kubernetes nodes). service_cidr = "10.2.0.0/16" is the range for Kubernetes Services — must not overlap with VNet or pod CIDRs. The oms_agent block connects AKS to Log Analytics for Container Insights monitoring — essential for production visibility.`,
    warnings:[
      "The service_cidr and dns_service_ip must not overlap with your VNet address space.",
      "AKS provisioning takes 5–10 minutes — longer than most Azure resources.",
      "After provisioning run: az aks get-credentials --name AKS_NAME --resource-group RG_NAME to get kubeconfig.",
      "sku_tier = Free has no SLA for the control plane — use Standard for production.",
    ],
  },
  lab:{
    intro:"Deploy an AKS cluster with a system node pool and a separate workload node pool, with Entra ID RBAC and monitoring enabled.",
    steps:[
      { title:"Add an AKS subnet", desc:`Add to your subnets variable:\naks = { cidr = "10.0.10.0/22", service_endpoints = [] }\n\nA /22 gives 1019 usable IPs — with Azure CNI each pod consumes one IP so a larger subnet is needed for AKS compared to regular VM subnets.` },
      { title:"Deploy the cluster", desc:`terraform apply\n\nThis takes 5–10 minutes. Monitor in portal:\nAzure Portal → Kubernetes Services → your cluster\n\nVerify:\n- Status: Running\n- Kubernetes version matches your variable\n- Node pools: system (1 node) + workload (1–10 nodes)` },
      { title:"Connect with kubectl", desc:`az aks get-credentials \\\n  --name aks-myapp-dev \\\n  --resource-group rg-myapp-dev-eus\n\nVerify connection:\nkubectl get nodes\n\nYou should see both node pools. System nodes have the CriticalAddonsOnly taint by default.` },
      { title:"Deploy a test workload", desc:`kubectl create deployment nginx --image=nginx --replicas=2\nkubectl expose deployment nginx --port=80 --type=LoadBalancer\n\nWait 2 minutes then:\nkubectl get service nginx\n\nThe EXTERNAL-IP will be an Azure public IP created by AKS automatically.` },
      { title:"Check monitoring", desc:`portal.azure.com → your AKS cluster → Insights tab\n\nYou should see:\n- Node CPU and memory utilisation\n- Pod counts\n- Container logs\n\nThis is Container Insights powered by the Log Analytics workspace.` },
    ],
  },
  challenge:{
    task:`Enable Microsoft Defender for Containers on the AKS cluster using the microsoft_defender block. Then create a Kubernetes namespace called production using the kubernetes provider in Terraform (add hashicorp/kubernetes to required_providers, configure it with the AKS cluster credentials). Output the namespace name and verify it exists with kubectl.`,
    hints:[
      `microsoft_defender { log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id } inside the AKS resource`,
      `provider "kubernetes" { host = azurerm_kubernetes_cluster.main.kube_config[0].host, cluster_ca_certificate = base64decode(azurerm_kubernetes_cluster.main.kube_config[0].cluster_ca_certificate), ... }`,
      `resource "kubernetes_namespace" "production" { metadata { name = "production" } }`,
      `kubectl get namespaces to verify after apply`,
    ],
    solution:`provider "kubernetes" {
  host                   = azurerm_kubernetes_cluster.main.kube_config[0].host
  client_certificate     = base64decode(azurerm_kubernetes_cluster.main.kube_config[0].client_certificate)
  client_key             = base64decode(azurerm_kubernetes_cluster.main.kube_config[0].client_key)
  cluster_ca_certificate = base64decode(azurerm_kubernetes_cluster.main.kube_config[0].cluster_ca_certificate)
}

resource "kubernetes_namespace" "production" {
  metadata { name = "production" }
}

# Add inside azurerm_kubernetes_cluster:
# microsoft_defender {
#   log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
# }

output "k8s_namespace" { value = kubernetes_namespace.production.metadata[0].name }`,
  },
  deepDiveTopics:[
    "AKS private cluster — API server with no public endpoint",
    "Azure CNI vs kubenet vs Overlay — deep network comparison",
    "Workload Identity — replacing pod-level service principals",
    "AKS node pool autoscaling — cluster autoscaler configuration",
    "AKS upgrades — control plane and node pool version management",
    "KEDA — Kubernetes Event-Driven Autoscaling with AKS",
  ],
},
// ─── DAY 24 ──────────────────────────────────────────────────────────────────
{
  id:24, phase:5, type:"advanced",
  title:"App Service & Azure Functions",
  subtitle:"Service plans, Linux web apps, Function Apps, Key Vault references",
  theory:{
    intro:`Azure App Service is a fully managed PaaS platform for hosting web applications, REST APIs, and mobile backends without managing VMs. Azure Functions extends this with serverless event-driven compute — you write a function, Azure handles scaling from zero to thousands of instances. Both run on App Service Plans. In Terraform the pattern is: create a Service Plan, then create one or more Web Apps or Function Apps on that plan.`,
    concepts:[
      { title:"App Service Plan SKUs", body:`Free (F1): shared infrastructure, 60 CPU minutes/day, no custom domain, no SLA — dev/test only. Basic (B1–B3): dedicated VMs, manual scale, custom domains. Standard (S1–S3): auto-scale, staging slots, daily backups, custom domains + SSL. Premium v3 (P1v3–P3v3): faster VMs, VNet integration, zone redundancy. Consumption: serverless, pay-per-execution — for Functions only. Flex Consumption: new Functions tier, faster cold start, VNet support.` },
      { title:"Linux vs Windows", body:`Linux App Service plans are cheaper than Windows for equivalent SKUs and support Docker containers natively. Use os_type = "Linux" for new deployments. Windows plans are required for: .NET Framework apps (not .NET Core/5+), WebJobs, and some legacy extensions. Both support Python, Node.js, Java, PHP, Ruby. For .NET 6+ use Linux — same performance, lower cost.` },
      { title:"Deployment Slots", body:`Deployment slots are live environments attached to your App Service — typically staging and production. You deploy to staging, test it, then swap staging and production (azurerm_app_service_active_slot or the swap function in portal/CLI). The swap is near-instantaneous with zero downtime. Slot-specific app settings (marked sticky = true) do not swap — connection strings, feature flags can be slot-specific.` },
      { title:"App Settings and Key Vault References", body:`App settings (environment variables) in App Service can reference Key Vault secrets directly using the syntax @Microsoft.KeyVault(SecretUri=https://kv-name.vault.azure.net/secrets/secret-name/). The App Service managed identity needs Key Vault Secrets User role. In Terraform set the app_settings value to this reference string — the App Service resolves it at runtime. Secrets never appear in Terraform state or App Service configuration UI.` },
      { title:"VNet Integration", body:`App Service VNet Integration lets outbound traffic from your app flow through a subnet in your VNet — enabling access to private resources like SQL databases and Key Vault without public endpoints. Requires a dedicated subnet (/28 minimum) with the Microsoft.Web service delegation. Configure with virtual_network_subnet_id in the site_config or the azurerm_app_service_virtual_network_swift_connection resource (legacy).` },
    ],
    code:`resource "azurerm_service_plan" "main" {
  name                = "asp-\${local.prefix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  os_type             = "Linux"
  sku_name            = var.environment == "prod" ? "P1v3" : "B1"
  tags                = local.tags
}

resource "azurerm_linux_web_app" "main" {
  name                = "app-\${local.prefix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  service_plan_id     = azurerm_service_plan.main.id

  identity { type = "SystemAssigned" }

  site_config {
    application_stack { node_version = "18-lts" }
    always_on         = var.environment == "prod"
    health_check_path = "/health"
  }

  app_settings = {
    "NODE_ENV"      = var.environment
    "DB_HOST"       = azurerm_mssql_server.main.fully_qualified_domain_name
    # Key Vault reference — secret never in Terraform state
    "DB_PASSWORD"   = "@Microsoft.KeyVault(SecretUri=\${azurerm_key_vault_secret.db_password.versionless_id})"
    "WEBSITE_RUN_FROM_PACKAGE" = "1"
  }

  logs {
    http_logs {
      file_system { retention_in_days = 7, retention_in_mb = 35 }
    }
    application_logs { file_system_level = "Warning" }
  }

  tags = local.tags
}

# Grant App managed identity Key Vault Secrets User role
resource "azurerm_role_assignment" "app_kv" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_linux_web_app.main.identity[0].principal_id
}

# Azure Function App
resource "azurerm_linux_function_app" "main" {
  name                       = "func-\${local.prefix}"
  location                   = azurerm_resource_group.main.location
  resource_group_name        = azurerm_resource_group.main.name
  service_plan_id            = azurerm_service_plan.main.id
  storage_account_name       = azurerm_storage_account.main.name
  storage_account_access_key = azurerm_storage_account.main.primary_access_key

  identity { type = "SystemAssigned" }

  site_config {
    application_stack { node_version = "18" }
  }

  app_settings = {
    "FUNCTIONS_WORKER_RUNTIME" = "node"
    "AzureWebJobsFeatureFlags"  = "EnableWorkerIndexing"
  }
  tags = local.tags
}

output "app_url"      { value = "https://\${azurerm_linux_web_app.main.default_hostname}" }
output "function_url" { value = "https://\${azurerm_linux_function_app.main.default_hostname}" }`,
    codeExplainer:`azurerm_key_vault_secret.db_password.versionless_id produces the URI without a version — App Service always gets the latest version of the secret automatically. The identity block on the web app creates a system-assigned managed identity. The role assignment grants that identity read access to Key Vault. This pattern means the DB password is never visible anywhere in Terraform output, plans, or state.`,
    warnings:[
      "always_on = true requires Basic tier or higher — on Free tier it causes a plan error.",
      "Function Apps require a Storage Account — it stores function metadata and execution logs.",
      "Key Vault references require the App Service managed identity to have Key Vault role assigned BEFORE deploying the app.",
      "versionless_id vs id — use versionless_id so App Service auto-picks up secret rotations without redeployment.",
    ],
  },
  lab:{
    intro:"Deploy a Linux App Service with a Node.js application, Key Vault references for secrets, and a staging deployment slot.",
    steps:[
      { title:"Create the Service Plan and Web App", desc:`Use the code example above.\n\nFor dev use sku_name = "B1" (cheapest paid tier — needed for deployment slots).\n\nSet node_version = "18-lts" in the application_stack.\n\nEnable always_on = false for dev (saves cost).` },
      { title:"Configure Key Vault reference", desc:`In app_settings add:\n"DB_PASSWORD" = "@Microsoft.KeyVault(SecretUri=\${azurerm_key_vault_secret.db_password.versionless_id})"\n\nDo NOT forget the role assignment granting the App identity Key Vault Secrets User.\n\nAfter apply: portal → App Service → Configuration → Application Settings — the DB_PASSWORD should show a green key vault icon.` },
      { title:"Add a deployment slot", desc:`resource "azurerm_linux_web_app_slot" "staging" {\n  name           = "staging"\n  app_service_id = azurerm_linux_web_app.main.id\n  site_config {\n    application_stack { node_version = "18-lts" }\n  }\n}\n\nThe staging slot URL will be: app-name-staging.azurewebsites.net` },
      { title:"Add Function App", desc:`Add azurerm_linux_function_app referencing the same service plan and the storage account from Day 13.\n\nSet FUNCTIONS_WORKER_RUNTIME = "node" in app_settings.\n\nAfter deploy: portal → Function App → Functions tab (empty until you deploy code).` },
      { title:"Verify in portal", desc:`App Service:\n- URL: https://app-myapp-dev.azurewebsites.net\n- Configuration → Application Settings → DB_PASSWORD shows KV reference resolved\n- Deployment slots: production + staging\n\nFunction App:\n- URL: https://func-myapp-dev.azurewebsites.net\n- Identity → System assigned → Status: On` },
    ],
  },
  challenge:{
    task:`Add VNet integration to the Web App so outbound traffic goes through your VNet subnet (enabling private connectivity to SQL Database without a public firewall rule). Create a dedicated integration subnet (10.0.8.0/28 minimum) with the Microsoft.Web service delegation. Then remove the SQL Server firewall rule that allowed Azure services and verify the app can still reach the database.`,
    hints:[
      `Add new subnet: webapp-integration with cidr = "10.0.8.0/28" and delegation to Microsoft.Web/serverFarms`,
      `Add to azurerm_linux_web_app: virtual_network_subnet_id = azurerm_subnet.subnets["webapp-integration"].id`,
      `Remove azurerm_mssql_firewall_rule.azure_services (the 0.0.0.0/0.0.0.0 rule)`,
      `Add a SQL firewall rule for the App Service outbound IPs — or better: enable SQL private endpoint`,
    ],
    solution:`variable "subnets" {
  default = {
    # ... existing subnets ...
    webapp-integration = {
      cidr = "10.0.8.0/28"
      service_endpoints = ["Microsoft.Sql"]
      delegation = { name = "webapp", service = "Microsoft.Web/serverFarms", actions = ["Microsoft.Network/virtualNetworks/subnets/action"] }
    }
  }
}

resource "azurerm_linux_web_app" "main" {
  # ... existing config ...
  virtual_network_subnet_id = azurerm_subnet.subnets["webapp-integration"].id
}

# Remove azurerm_mssql_firewall_rule.azure_services
# Add SQL VNet rule instead:
resource "azurerm_mssql_virtual_network_rule" "webapp" {
  name      = "allow-webapp-subnet"
  server_id = azurerm_mssql_server.main.id
  subnet_id = azurerm_subnet.subnets["webapp-integration"].id
}`,
  },
  deepDiveTopics:[
    "App Service Environments — fully isolated dedicated infrastructure",
    "Deployment slots — blue-green deployments with slot swaps",
    "App Service autoscale — HTTP queue depth based scaling rules",
    "Azure Functions Durable — stateful function orchestrations",
    "Custom domains and managed certificates — zero-cost TLS",
    "App Service diagnostics — Application Insights integration",
  ],
},
// ─── DAY 25 ──────────────────────────────────────────────────────────────────
{
  id:25, phase:5, type:"advanced",
  title:"Entra ID & RBAC with Terraform",
  subtitle:"azuread provider, service principals, custom roles, role assignments",
  theory:{
    intro:`Managing Azure identities and access control through Terraform closes the loop on infrastructure automation — you can create resources AND define who has access to them in the same codebase. The azuread provider manages objects in Azure Entra ID (formerly Azure AD): applications, service principals, groups, and users. The azurerm provider manages RBAC role assignments on Azure resources. Together they give you fully automated, auditable identity management.`,
    concepts:[
      { title:"azuread Provider", body:`A separate provider from azurerm — it manages Entra ID objects. Add it to required_providers: azuread = { source = "hashicorp/azuread", version = "~> 2.47" }. Key resources: azuread_application (an app registration), azuread_service_principal (the enterprise application linked to the app registration), azuread_group (an Entra ID security group), azuread_group_member (adds a user or SP to a group). Uses the same ARM_* credentials as azurerm.` },
      { title:"Service Principal for Automation", body:`Pattern for creating a SP for an application: azuread_application → azuread_service_principal → azuread_service_principal_password (generates a client secret). Then azurerm_role_assignment to grant the SP permissions on Azure resources. Store the password in Key Vault immediately. This is how you create service accounts for CI/CD pipelines, third-party tools, and application MSIs programmatically.` },
      { title:"Custom RBAC Roles", body:`azurerm_role_definition creates custom roles when built-in roles are too broad. Define a name, description, and permissions as actions (allowed API operations) and not_actions (explicitly denied). Scope the role to a subscription, resource group, or specific resource. Custom roles with minimal permissions follow the principle of least privilege — e.g. a role that can only read Key Vault secrets but cannot create or delete them.` },
      { title:"Role Assignments at Scale", body:`azurerm_role_assignment assigns a built-in or custom role to a principal (user, group, SP, managed identity) at a scope (subscription, resource group, resource). scope is the ARM resource ID. role_definition_name uses the built-in role name. role_definition_id uses a custom role definition ID. Always assign to groups not individual users — when people leave you remove them from the group, not from 50 individual role assignments.` },
      { title:"Conditional Access and PIM", body:`Terraform cannot directly manage Conditional Access policies (they live in the azuread provider's azuread_conditional_access_policy resource — preview). Azure PIM (Privileged Identity Management) — just-in-time role activation — is not yet fully manageable via Terraform. Use the Azure portal or PowerShell for CA and PIM policies, and manage all resource RBAC through Terraform.` },
    ],
    code:`terraform {
  required_providers {
    azurerm = { source = "hashicorp/azurerm", version = "~> 3.85" }
    azuread = { source = "hashicorp/azuread", version = "~> 2.47" }
  }
}

provider "azuread" {}  # uses same ARM_* env vars

# Create an app registration + service principal for a CI/CD pipeline
resource "azuread_application" "cicd" {
  display_name = "app-cicd-\${local.prefix}"
}

resource "azuread_service_principal" "cicd" {
  client_id = azuread_application.cicd.client_id
}

resource "azuread_service_principal_password" "cicd" {
  service_principal_id = azuread_service_principal.cicd.id
  end_date             = timeadd(timestamp(), "8760h")  # 1 year
}

# Store the secret in Key Vault
resource "azurerm_key_vault_secret" "cicd_secret" {
  name         = "cicd-client-secret"
  value        = azuread_service_principal_password.cicd.value
  key_vault_id = azurerm_key_vault.main.id
  depends_on   = [azurerm_role_assignment.kv_tf]
}

# Grant the SP Contributor on the resource group
resource "azurerm_role_assignment" "cicd_contributor" {
  scope                = azurerm_resource_group.main.id
  role_definition_name = "Contributor"
  principal_id         = azuread_service_principal.cicd.object_id
}

# Custom role — read-only Key Vault secrets access
resource "azurerm_role_definition" "kv_reader" {
  name        = "KeyVault-Secret-Reader-\${local.prefix}"
  scope       = azurerm_resource_group.main.id
  description = "Can read and list Key Vault secrets, nothing else"

  permissions {
    actions = [
      "Microsoft.KeyVault/vaults/secrets/read",
      "Microsoft.KeyVault/vaults/secrets/getSecret/action",
    ]
    not_actions = []
  }

  assignable_scopes = [azurerm_resource_group.main.id]
}

# Assign custom role to a group
resource "azuread_group" "app_readers" {
  display_name     = "grp-app-kv-readers-\${local.prefix}"
  security_enabled = true
}

resource "azurerm_role_assignment" "kv_readers" {
  scope              = azurerm_key_vault.main.id
  role_definition_id = azurerm_role_definition.kv_reader.role_definition_resource_id
  principal_id       = azuread_group.app_readers.object_id
}

output "cicd_client_id" { value = azuread_application.cicd.client_id }
output "cicd_tenant_id" { value = data.azurerm_client_config.current.tenant_id }`,
    codeExplainer:`The app registration and service principal are two separate objects in Entra ID — the app is the definition, the SP is the instance in your tenant. azuread_service_principal_password generates a client secret with a 1-year expiry. role_definition_resource_id (not id) gives the full ARM resource ID needed for role assignments using custom roles. Assigning to a group (azuread_group) instead of individual users makes access management scalable.`,
    warnings:[
      "azuread_service_principal_password generates a new secret on every apply if not stabilised with lifecycle ignore_changes.",
      "Custom role names must be unique within a tenant — include your prefix to avoid conflicts.",
      "Role assignments take up to 5 minutes to propagate — use depends_on if subsequent resources require the assignment.",
      "Deleting an azuread_application also invalidates all tokens issued to it — impacts any running apps immediately.",
    ],
  },
  lab:{
    intro:"Create a service principal for a CI/CD pipeline, assign it the correct roles, create a security group for app operators, and assign a custom read-only role.",
    steps:[
      { title:"Add azuread provider", desc:`In versions.tf add:\nazuread = { source = "hashicorp/azuread", version = "~> 2.47" }\n\nAdd to provider.tf:\nprovider "azuread" {}\n\nRun terraform init to download the new provider.` },
      { title:"Create the CI/CD service principal", desc:`Create azuread_application, azuread_service_principal, and azuread_service_principal_password as shown in the code example.\n\nStore the secret in Key Vault.\n\nAssign Contributor role to the SP on the resource group.` },
      { title:"Create the custom reader role", desc:`Create azurerm_role_definition with only Key Vault secret read permissions.\n\nLimit assignable_scopes to your resource group — not the whole subscription.\n\nRun terraform apply and verify the role appears in portal under:\nResource Group → Access Control (IAM) → Roles tab → Custom roles` },
      { title:"Create group and assign role", desc:`Create azuread_group for app readers.\n\nAssign the custom role to the group.\n\nVerify in portal:\nKey Vault → Access Control (IAM) → Role Assignments\n→ should show the group with your custom role.` },
      { title:"Test the SP credentials", desc:`Get the SP credentials from outputs:\nterraform output cicd_client_id\naz keyvault secret show --name cicd-client-secret --vault-name KV_NAME\n\nAuthenticate as the SP:\nexport ARM_CLIENT_ID="sp-client-id"\nexport ARM_CLIENT_SECRET="retrieved-secret"\nexport ARM_TENANT_ID="your-tenant"\n\nTest it has access:\naz resource list --resource-group RG_NAME` },
    ],
  },
  challenge:{
    task:`Create an Entra ID conditional access policy using azuread_conditional_access_policy that requires MFA for all users accessing the Azure portal (Microsoft Azure Management app, app ID 797f4846-ba00-4fd7-ba43-dac1f8f63013) except when coming from a trusted named location you also define. Output the policy ID and state.`,
    hints:[
      `azuread_named_location with ip = { ip_ranges = ["your-office-ip/32"], trusted = true }`,
      `azuread_conditional_access_policy with conditions and grant_controls blocks`,
      `conditions.applications.included_applications = ["797f4846-ba00-4fd7-ba43-dac1f8f63013"]`,
      `grant_controls { operator = "OR", built_in_controls = ["mfa"] }`,
    ],
    solution:`resource "azuread_named_location" "office" {
  display_name = "Office Network"
  ip {
    ip_ranges = ["203.0.113.0/24"]  # replace with your IP
    trusted   = true
  }
}

resource "azuread_conditional_access_policy" "require_mfa" {
  display_name = "Require MFA for Azure Portal"
  state        = "enabledForReportingButNotEnforced"  # audit mode first

  conditions {
    client_app_types = ["all"]
    applications {
      included_applications = ["797f4846-ba00-4fd7-ba43-dac1f8f63013"]
    }
    users {
      included_users = ["All"]
    }
    locations {
      included_locations = ["All"]
      excluded_locations = [azuread_named_location.office.id]
    }
  }

  grant_controls {
    operator          = "OR"
    built_in_controls = ["mfa"]
  }
}

output "ca_policy_id"    { value = azuread_conditional_access_policy.require_mfa.id }
output "ca_policy_state" { value = azuread_conditional_access_policy.require_mfa.state }`,
  },
  deepDiveTopics:[
    "Azure RBAC vs Entra ID roles — the two separate role systems",
    "Workload Identity Federation — OIDC-based auth without client secrets",
    "Managed Identity types — system-assigned vs user-assigned",
    "Azure PIM automation — eligible role assignments via Terraform",
    "Entra ID Application manifest — API permissions and scopes",
    "Privileged access groups — time-bound group membership",
  ],
},
// ─── DAY 26 ──────────────────────────────────────────────────────────────────
{
  id:26, phase:5, type:"advanced",
  title:"Microsoft Sentinel via Terraform",
  subtitle:"Sentinel onboarding, data connectors, analytic rules, automation",
  theory:{
    intro:`Microsoft Sentinel is Azure's cloud-native SIEM and SOAR solution. It collects security data from across your Azure environment (and beyond), applies analytics to detect threats, and automates responses. Terraform can manage the full Sentinel lifecycle: onboarding a Log Analytics workspace to Sentinel, enabling data connectors, creating analytic rules, and setting up automation rules. This is directly relevant to your existing Sentinel and Cisco Umbrella integration work.`,
    concepts:[
      { title:"Sentinel Architecture", body:`Sentinel sits on top of a Log Analytics Workspace — all data flows into Log Analytics tables and Sentinel provides the security analytics layer on top. Onboarding = telling Azure that this Log Analytics workspace is a Sentinel workspace. Data connectors pull data from sources into the workspace. Analytic rules query the data with KQL and raise incidents. Automation rules and playbooks respond to incidents.` },
      { title:"Onboarding via Terraform", body:`azurerm_sentinel_log_analytics_workspace_onboarding is the Terraform resource that activates Sentinel on a Log Analytics workspace. It takes just the workspace_id. This single resource transforms a regular Log Analytics workspace into a Sentinel workspace. The workspace must exist first — create it in the same config or reference it from another config's remote state.` },
      { title:"Data Connectors", body:`Each connector type is a separate Terraform resource. azurerm_sentinel_data_connector_azure_active_directory connects Entra ID sign-in and audit logs. azurerm_sentinel_data_connector_microsoft_defender_cloud connects Defender for Cloud alerts. azurerm_sentinel_data_connector_office_365 connects Exchange, SharePoint, Teams. For Cisco Umbrella: use the CEF/Syslog connector via an Azure Monitor AMA policy — not a direct Terraform resource yet.` },
      { title:"Scheduled Analytic Rules", body:`azurerm_sentinel_alert_rule_scheduled defines a KQL query that runs on a schedule and raises an incident when results are found. Key fields: query (KQL), query_frequency (how often it runs — PT5M to PT24H), query_period (time window to look back — PT5M to P14D), trigger_operator and trigger_threshold (when to create an alert — GreaterThan 0 means any result triggers). severity: Informational, Low, Medium, High.` },
      { title:"Automation Rules", body:`azurerm_sentinel_automation_rule triggers automatically when an incident is created or updated. Actions: assign owner, change severity, change status, add tags, or run a Logic App playbook. Common uses: auto-close low-severity informational alerts, assign incidents to specific analysts based on alert name, trigger a Logic App that posts to Teams or creates a ticket in ServiceNow.` },
    ],
    code:`# Log Analytics Workspace (reuse from Day 17 if available)
resource "azurerm_log_analytics_workspace" "sentinel" {
  name                = "law-sentinel-\${local.prefix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"
  retention_in_days   = 90
  tags                = local.tags
}

# Onboard to Sentinel
resource "azurerm_sentinel_log_analytics_workspace_onboarding" "main" {
  workspace_id = azurerm_log_analytics_workspace.sentinel.id
}

# Entra ID data connector
resource "azurerm_sentinel_data_connector_azure_active_directory" "aad" {
  name                       = "AADConnector"
  log_analytics_workspace_id = azurerm_log_analytics_workspace.sentinel.id
  depends_on                 = [azurerm_sentinel_log_analytics_workspace_onboarding.main]
}

# Scheduled analytic rule — detect impossible travel
resource "azurerm_sentinel_alert_rule_scheduled" "impossible_travel" {
  name                       = "Impossible-Travel-SignIn"
  log_analytics_workspace_id = azurerm_log_analytics_workspace.sentinel.id
  display_name               = "Sign-in from two geographies within 1 hour"
  severity                   = "Medium"
  enabled                    = true

  query = <<-KQL
    let timeframe = 1h;
    SigninLogs
    | where TimeGenerated > ago(timeframe)
    | where ResultType == 0
    | summarize Locations = make_set(Location),
                IPAddresses = make_set(IPAddress),
                Count = count()
      by UserPrincipalName
    | where array_length(Locations) > 1
    | extend Alert = strcat("User signed in from: ", tostring(Locations))
  KQL

  query_frequency = "PT1H"
  query_period    = "PT1H"
  trigger_operator  = "GreaterThan"
  trigger_threshold = 0

  incident_configuration {
    create_incident = true
    grouping {
      enabled                 = true
      lookback_duration       = "PT5H"
      reopen_closed_incidents = false
      entity_matching_method  = "AllEntities"
    }
  }

  tactics    = ["InitialAccess"]
  techniques = ["T1078"]

  depends_on = [azurerm_sentinel_log_analytics_workspace_onboarding.main]
}

# Automation rule — auto-close informational alerts
resource "azurerm_sentinel_automation_rule" "close_informational" {
  name                       = "Auto-Close-Informational"
  log_analytics_workspace_id = azurerm_log_analytics_workspace.sentinel.id
  display_name               = "Auto close Informational severity incidents"
  order                      = 1
  enabled                    = true

  condition {
    property  = "IncidentSeverity"
    operator  = "Equals"
    values    = ["Informational"]
  }

  action_incident {
    order  = 1
    status = "Closed"
    classification              = "BenignPositive"
    classification_comment      = "Auto-closed: Informational severity"
  }

  depends_on = [azurerm_sentinel_log_analytics_workspace_onboarding.main]
}

output "sentinel_workspace_id" { value = azurerm_log_analytics_workspace.sentinel.id }`,
    codeExplainer:`depends_on = [azurerm_sentinel_log_analytics_workspace_onboarding.main] is required on every Sentinel resource — connectors and rules cannot be created on a workspace that is not yet onboarded to Sentinel, and Terraform cannot infer this dependency from attribute references alone. The KQL query in the analytic rule is a real impossible travel detection query — it finds users who signed in from multiple geographic locations within one hour.`,
    warnings:[
      "Sentinel onboarding must complete before adding any connectors or rules — always use depends_on.",
      "Sentinel data ingestion costs are based on Log Analytics pricing — monitor daily ingestion to avoid surprise bills.",
      "The Entra ID connector requires Global Reader or Security Reader permissions on the tenant.",
      "KQL in Terraform HCL heredoc strings — use <<-KQL and KQL delimiters and avoid backslash conflicts.",
    ],
  },
  lab:{
    intro:"Onboard a Log Analytics workspace to Sentinel, enable the Entra ID connector, and create a scheduled analytic rule for brute-force detection.",
    steps:[
      { title:"Create or reuse Log Analytics Workspace", desc:`If you have the workspace from Day 17:\ndata "terraform_remote_state" "app" { ... }\nworkspace_id = data.terraform_remote_state.app.outputs.log_analytics_workspace_id\n\nOr create a new one:\nazurerm_log_analytics_workspace with retention_in_days = 90\n(90 days is recommended minimum for security investigations)` },
      { title:"Onboard to Sentinel", desc:`resource "azurerm_sentinel_log_analytics_workspace_onboarding" "main" {\n  workspace_id = azurerm_log_analytics_workspace.sentinel.id\n}\n\nterraform apply\n\nVerify in portal:\nAzure portal → Microsoft Sentinel → Add → select your workspace → Add\nOr check that the workspace now appears in Sentinel overview.` },
      { title:"Enable Entra ID connector", desc:`Add azurerm_sentinel_data_connector_azure_active_directory with depends_on on the onboarding resource.\n\nAfter apply:\nSentinel portal → Data connectors → Azure Active Directory\nStatus should show: Connected` },
      { title:"Create a brute-force detection rule", desc:`Create azurerm_sentinel_alert_rule_scheduled:\n- query: SigninLogs | where ResultType != 0 | summarize FailureCount = count() by UserPrincipalName, bin(TimeGenerated, 5m) | where FailureCount > 10\n- query_frequency = "PT5M"\n- severity = "Medium"\n- trigger_operator = "GreaterThan", trigger_threshold = 0` },
      { title:"Verify in Sentinel portal", desc:`portal.azure.com → Microsoft Sentinel → your workspace\n\nAnalytics tab → Active rules\nYour rule should appear with status: Enabled\n\nConfiguration → Data connectors\nEntra ID connector should show: Connected` },
    ],
  },
  challenge:{
    task:`Create a Sentinel watchlist from a CSV containing high-risk IP ranges, then modify the impossible travel analytic rule to exclude IP addresses found in the watchlist (trusted office IPs). Output the watchlist alias so other rules can reference it. Hint: watchlists are queried in KQL as _GetWatchlist('watchlist-alias').`,
    hints:[
      `azurerm_sentinel_watchlist creates the watchlist with item_search_key and a display_name`,
      `azurerm_sentinel_watchlist_item adds individual items (IP ranges) to the watchlist`,
      `In KQL reference: let trusted = _GetWatchlist('trusted-ips') | project SearchKey;`,
      `Then filter: | where IPAddress !in (trusted)`,
    ],
    solution:`resource "azurerm_sentinel_watchlist" "trusted_ips" {
  name                       = "trusted-ips"
  log_analytics_workspace_id = azurerm_log_analytics_workspace.sentinel.id
  display_name               = "Trusted Office IP Ranges"
  item_search_key            = "IPRange"
  depends_on                 = [azurerm_sentinel_log_analytics_workspace_onboarding.main]
}

resource "azurerm_sentinel_watchlist_item" "office1" {
  watchlist_id = azurerm_sentinel_watchlist.trusted_ips.id
  properties = {
    IPRange = "203.0.113.0/24"
    Location = "HQ Office"
  }
}

# Updated KQL in analytic rule:
# let trusted_ips = _GetWatchlist('trusted-ips') | project IPRange;
# SigninLogs
# | where IPAddress !in (trusted_ips)
# | ... rest of query

output "watchlist_alias" { value = azurerm_sentinel_watchlist.trusted_ips.name }`,
  },
  deepDiveTopics:[
    "Sentinel MITRE ATT&CK framework — mapping rules to tactics and techniques",
    "Sentinel Fusion rules — multi-stage attack detection",
    "Logic App playbooks — automated incident response workflows",
    "Cisco Umbrella integration — CEF syslog to Sentinel via AMA",
    "Sentinel cost management — tiered commitment pricing vs PAYG",
    "Custom connectors — REST API poller and Azure Function connectors",
  ],
},
// ─── DAY 27 ──────────────────────────────────────────────────────────────────
{
  id:27, phase:5, type:"project",
  title:"PROJECT — AKS + Sentinel Security Platform",
  subtitle:"AKS with Defender, Sentinel onboarding, diagnostic settings, alert rules",
  theory:{
    intro:`Today's project combines the AKS cluster from Day 23 with the Sentinel SIEM from Day 26 into an integrated security platform. You will enable Microsoft Defender for Containers, forward AKS control plane logs to Sentinel, create detection rules for Kubernetes-specific threats, and configure an automation rule that creates a Teams notification for high-severity incidents. This mirrors a real production security architecture for Kubernetes workloads.`,
    concepts:[
      { title:"Defender for Containers", body:`Microsoft Defender for Containers protects AKS clusters: vulnerability assessment for container images in ACR, runtime threat detection for suspicious container behaviour, Kubernetes control plane audit log analysis, and recommendations in Defender for Cloud. Enable it by setting microsoft_defender { log_analytics_workspace_id = ... } in the AKS resource block. No additional agents needed for AKS — it uses the built-in AKS monitoring capabilities.` },
      { title:"AKS Diagnostic Settings", body:`AKS generates several log categories: kube-apiserver (API server audit logs), kube-audit (Kubernetes audit events including kubectl commands), kube-controller-manager, kube-scheduler, cluster-autoscaler. For security: enable kube-audit and kube-audit-admin — these capture who ran what kubectl commands and when. Ship them to the Sentinel Log Analytics workspace via azurerm_monitor_diagnostic_setting.` },
      { title:"Kubernetes Threat Detection KQL", body:`AKS audit logs flow into the AzureDiagnostics table in Log Analytics under Category = kube-audit. Common threat detections: privileged container creation (detect pods with securityContext.privileged = true), kubectl exec into running pods (verb = "create" on resource = "pods/exec"), service account token mounting anomalies, and namespace escape attempts. These are real queries used in production Sentinel environments.` },
      { title:"Full Integration Architecture", body:`AKS cluster → Defender for Containers (runtime threats) → Defender for Cloud (unified view). AKS control plane → Diagnostic Setting → Log Analytics → Sentinel Analytics Rules → Incidents → Automation Rules → Logic App Playbook → Microsoft Teams notification. This end-to-end pipeline means every suspicious kubectl command or container breach creates a trackable incident with automated notification.` },
    ],
    code:`# Enable Defender for Containers on AKS
resource "azurerm_kubernetes_cluster" "main" {
  # ... existing config from Day 23 ...
  microsoft_defender {
    log_analytics_workspace_id = azurerm_log_analytics_workspace.sentinel.id
  }
}

# Ship AKS control plane logs to Sentinel workspace
resource "azurerm_monitor_diagnostic_setting" "aks" {
  name                       = "aks-to-sentinel"
  target_resource_id         = azurerm_kubernetes_cluster.main.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.sentinel.id

  enabled_log { category = "kube-apiserver" }
  enabled_log { category = "kube-audit" }
  enabled_log { category = "kube-audit-admin" }
  enabled_log { category = "kube-controller-manager" }
  enabled_log { category = "cluster-autoscaler" }

  metric { category = "AllMetrics" }
}

# Sentinel rule — detect privileged container creation
resource "azurerm_sentinel_alert_rule_scheduled" "privileged_container" {
  name                       = "AKS-Privileged-Container"
  log_analytics_workspace_id = azurerm_log_analytics_workspace.sentinel.id
  display_name               = "Privileged container created in AKS"
  severity                   = "High"
  enabled                    = true

  query = <<-KQL
    AzureDiagnostics
    | where Category == "kube-audit"
    | where TimeGenerated > ago(1h)
    | where log_s has "privileged"
    | extend ParsedLog = parse_json(log_s)
    | where ParsedLog.verb == "create"
    | where ParsedLog.objectRef.resource == "pods"
    | extend PodName     = tostring(ParsedLog.objectRef.name)
    | extend Namespace   = tostring(ParsedLog.objectRef.namespace)
    | extend RequestedBy = tostring(ParsedLog.user.username)
    | project TimeGenerated, PodName, Namespace, RequestedBy, ClusterName = ResourceId
  KQL

  query_frequency   = "PT15M"
  query_period      = "PT1H"
  trigger_operator  = "GreaterThan"
  trigger_threshold = 0
  severity_override = false
  tactics           = ["PrivilegeEscalation"]
  techniques        = ["T1611"]

  depends_on = [azurerm_sentinel_log_analytics_workspace_onboarding.main]
}

# Sentinel rule — kubectl exec into pod
resource "azurerm_sentinel_alert_rule_scheduled" "kubectl_exec" {
  name                       = "AKS-Kubectl-Exec"
  log_analytics_workspace_id = azurerm_log_analytics_workspace.sentinel.id
  display_name               = "kubectl exec detected on running pod"
  severity                   = "Medium"
  enabled                    = true

  query = <<-KQL
    AzureDiagnostics
    | where Category == "kube-audit"
    | extend ParsedLog = parse_json(log_s)
    | where ParsedLog.verb == "create"
    | where ParsedLog.objectRef.subresource == "exec"
    | extend PodName     = tostring(ParsedLog.objectRef.name)
    | extend Namespace   = tostring(ParsedLog.objectRef.namespace)
    | extend RequestedBy = tostring(ParsedLog.user.username)
    | project TimeGenerated, PodName, Namespace, RequestedBy
  KQL

  query_frequency   = "PT10M"
  query_period      = "PT1H"
  trigger_operator  = "GreaterThan"
  trigger_threshold = 0
  tactics           = ["Execution"]
  techniques        = ["T1609"]

  depends_on = [azurerm_sentinel_log_analytics_workspace_onboarding.main]
}`,
    codeExplainer:`kube-audit logs capture every API server request as JSON in the log_s field. The privileged container query parses this JSON inline with parse_json() and filters for pod creation requests containing the word "privileged". The kubectl exec query specifically looks for verb=create on subresource=exec — this is how Kubernetes represents exec commands in its audit log. Both queries project the fields most useful for an analyst investigating the incident.`,
    warnings:[
      "AKS diagnostic setting logs generate significant data volume — monitor Log Analytics ingestion costs.",
      "kube-audit-admin contains sensitive audit data including secret values in some API calls — restrict workspace access.",
      "Defender for Containers billing is per vCore per hour — factor this into AKS node pool sizing decisions.",
      "AKS audit logs arrive in Log Analytics with a 2–5 minute delay — set query_period to at least 15 minutes.",
    ],
  },
  lab:{
    intro:"Enable Defender for Containers on the Day 23 AKS cluster, forward logs to Sentinel, and create Kubernetes-specific detection rules.",
    steps:[
      { title:"Update AKS to enable Defender", desc:`Add to the azurerm_kubernetes_cluster resource:\nmicrosoft_defender {\n  log_analytics_workspace_id = azurerm_log_analytics_workspace.sentinel.id\n}\n\nterraform apply\n\nVerify in portal:\nMicrosoft Defender for Cloud → Environment settings → your AKS cluster\n→ Defender for Containers: On` },
      { title:"Create AKS diagnostic setting", desc:`Create azurerm_monitor_diagnostic_setting targeting azurerm_kubernetes_cluster.main.id.\n\nEnable these log categories:\n- kube-apiserver\n- kube-audit\n- kube-audit-admin\n- kube-controller-manager\n- cluster-autoscaler\n\nPoint to the Sentinel Log Analytics workspace.` },
      { title:"Deploy the detection rules", desc:`Create both analytic rules from the code example:\n1. Privileged container detection\n2. kubectl exec detection\n\nBoth with depends_on = [azurerm_sentinel_log_analytics_workspace_onboarding.main]\n\nVerify in Sentinel portal → Analytics → Active rules` },
      { title:"Test the detection", desc:`Run a privileged pod in your AKS cluster:\nkubectl run priv-test --image=alpine --restart=Never \\\n  --overrides='{"spec":{"containers":[{"name":"priv-test","image":"alpine","securityContext":{"privileged":true}}]}}'\n\nWait 15–20 minutes for logs to arrive and the rule to run.\n\nCheck Sentinel → Incidents for a new Medium/High severity incident.` },
      { title:"Add automation rule for Teams notification", desc:`Create azurerm_sentinel_automation_rule targeting High severity incidents.\n\nFor the Teams notification you would normally attach a Logic App playbook. For this lab just create an automation rule that adds a tag "needs-review" to High severity incidents:\n\naction_incident {\n  order = 1\n  labels = ["needs-review"]\n}` },
    ],
  },
  challenge:{
    task:`Create a Sentinel Analytics rule that detects when a Kubernetes service account is used from outside the cluster — i.e. the token is used from an IP address that is not within your AKS subnet CIDR range. Use the SigninLogs or AzureDiagnostics table. Output the rule ID and the KQL query used. This simulates detecting a stolen service account token.`,
    hints:[
      `Query AzureDiagnostics where Category == "kube-audit" and look for service account usernames (system:serviceaccount:*)`,
      `Filter where the source IP is not in your AKS subnet range using ipv4_is_in_range() KQL function`,
      `ipv4_is_in_range(ipAddress, "10.0.10.0/22") returns true if IP is in the AKS subnet`,
      `| where not(ipv4_is_in_range(sourceIP, "10.0.10.0/22")) to find external access`,
    ],
    solution:`resource "azurerm_sentinel_alert_rule_scheduled" "sa_external_use" {
  name                       = "AKS-ServiceAccount-External-Use"
  log_analytics_workspace_id = azurerm_log_analytics_workspace.sentinel.id
  display_name               = "Kubernetes service account used from outside cluster network"
  severity                   = "High"
  enabled                    = true

  query = <<-KQL
    AzureDiagnostics
    | where Category == "kube-audit"
    | extend ParsedLog  = parse_json(log_s)
    | extend Username   = tostring(ParsedLog.user.username)
    | extend SourceIP   = tostring(ParsedLog.sourceIPs[0])
    | where Username startswith "system:serviceaccount:"
    | where isnotempty(SourceIP)
    | where not(ipv4_is_in_range(SourceIP, "10.0.10.0/22"))
    | where not(ipv4_is_in_range(SourceIP, "10.0.0.0/16"))
    | project TimeGenerated, Username, SourceIP,
              Verb = tostring(ParsedLog.verb),
              Resource = tostring(ParsedLog.objectRef.resource)
  KQL

  query_frequency   = "PT15M"
  query_period      = "PT1H"
  trigger_operator  = "GreaterThan"
  trigger_threshold = 0
  tactics           = ["CredentialAccess", "LateralMovement"]
  depends_on        = [azurerm_sentinel_log_analytics_workspace_onboarding.main]
}

output "rule_id" { value = azurerm_sentinel_alert_rule_scheduled.sa_external_use.id }`,
  },
  deepDiveTopics:[
    "Defender for Cloud security posture — CSPM recommendations via Terraform",
    "Kubernetes Network Policies — zero-trust networking within AKS",
    "AKS secrets management — Azure Key Vault CSI Driver",
    "Container image scanning — Defender for ACR integration",
    "Sentinel UEBA — User Entity Behavior Analytics configuration",
    "SOC automation — full IR playbook with Logic Apps",
  ],
},
// ─── DAY 28 ──────────────────────────────────────────────────────────────────
{
  id:28, phase:6, type:"advanced",
  title:"CI/CD — Azure DevOps Pipelines",
  subtitle:"YAML pipelines, terraform plan on PR, terraform apply on merge, approvals",
  theory:{
    intro:`Running Terraform from a laptop is fine for learning but risky for teams — anyone can apply anything at any time with no review. CI/CD pipelines enforce a workflow: every change goes through a PR, Terraform shows the plan in the PR diff, a reviewer approves, and apply only runs when code merges to main. Azure DevOps Pipelines gives you this workflow with service connections handling Azure authentication so developers never need Azure credentials locally.`,
    concepts:[
      { title:"Pipeline Architecture", body:`Two pipelines: PR pipeline (triggered on pull_request — runs terraform plan and posts result as a PR comment, blocks merge if plan fails) and main pipeline (triggered on push to main — runs terraform plan then terraform apply with a manual approval gate before apply). Both use the same YAML template to avoid duplication. The pipeline runs in an Azure DevOps agent (Microsoft-hosted ubuntu-latest for simplicity, self-hosted for private networking).` },
      { title:"Service Connection for Azure", body:`A service connection in Azure DevOps stores the Azure credentials — your pipeline references the connection name, not raw credentials. Create via: Project Settings → Service connections → Azure Resource Manager → Service Principal (automatic). Azure DevOps creates the SP and stores it securely. Reference in pipeline: azureSubscription: 'your-connection-name'. The TerraformInstaller task can then use this connection for authentication.` },
      { title:"TerraformInstaller and Tasks", body:`The ms-devlabs.custom-terraform-tasks extension provides: TerraformInstaller (downloads specific Terraform version), TerraformTaskV4 (wraps init, validate, plan, apply, destroy with Azure backend auth built in). Alternatively use a plain Script task running terraform commands directly — simpler, no extension dependency. Both approaches work; plain scripts are more portable.` },
      { title:"Plan Output in PR Comments", body:`Store terraform plan output as an artifact: terraform plan -out=tfplan, terraform show -no-color tfplan > plan.txt, then use the Azure DevOps API to post plan.txt as a PR comment. This lets reviewers see the exact infrastructure changes the PR will make — they approve infrastructure changes not just code changes. Only approve if the plan shows exactly what was intended.` },
      { title:"Manual Approval Gate", body:`In Azure DevOps: Environments → create an environment named production → add an Approval check with specific approvers. In the pipeline reference the environment in the apply stage: environment: production. The pipeline pauses at the apply stage and waits for the designated approver to click Approve in the DevOps UI. The approval is logged in the pipeline run history for audit purposes.` },
    ],
    code:`# azure-pipelines.yml
trigger:
  branches:
    include: [main]

pr:
  branches:
    include: ['*']

variables:
  TF_VERSION: '1.7.0'
  TF_WORKING_DIR: 'environments/dev'
  BACKEND_RG:  'rg-tfstate-learn'
  BACKEND_SA:  'stterraformlearn001'
  BACKEND_CONT: 'tfstate'
  BACKEND_KEY:  'dev/main.tfstate'

pool:
  vmImage: 'ubuntu-latest'

stages:
  - stage: Validate
    displayName: Validate & Plan
    jobs:
      - job: TerraformPlan
        steps:
          - task: TerraformInstaller@1
            inputs:
              terraformVersion: \$(TF_VERSION)

          - task: AzureCLI@2
            displayName: Terraform Init
            inputs:
              azureSubscription: 'azure-service-connection'
              scriptType: bash
              scriptLocation: inlineScript
              inlineScript: |
                cd \$(TF_WORKING_DIR)
                terraform init \\
                  -backend-config="resource_group_name=\$(BACKEND_RG)" \\
                  -backend-config="storage_account_name=\$(BACKEND_SA)" \\
                  -backend-config="container_name=\$(BACKEND_CONT)" \\
                  -backend-config="key=\$(BACKEND_KEY)" \\
                  -backend-config="use_azuread_auth=true"

          - task: AzureCLI@2
            displayName: Terraform Plan
            inputs:
              azureSubscription: 'azure-service-connection'
              scriptType: bash
              scriptLocation: inlineScript
              inlineScript: |
                cd \$(TF_WORKING_DIR)
                terraform plan -out=tfplan -no-color 2>&1 | tee plan.txt
                terraform show -no-color tfplan >> plan.txt

          - publish: \$(TF_WORKING_DIR)/plan.txt
            artifact: terraform-plan

          - task: AzureCLI@2
            displayName: Post Plan to PR
            condition: eq(variables['Build.Reason'], 'PullRequest')
            inputs:
              azureSubscription: 'azure-service-connection'
              scriptType: bash
              scriptLocation: inlineScript
              inlineScript: |
                PLAN=\$(cat \$(TF_WORKING_DIR)/plan.txt)
                # Post to PR via Azure DevOps REST API
                curl -X POST \\
                  -H "Authorization: Bearer \$(System.AccessToken)" \\
                  -H "Content-Type: application/json" \\
                  "\$(System.CollectionUri)\$(System.TeamProject)/_apis/git/repositories/\$(Build.Repository.ID)/pullRequests/\$(System.PullRequest.PullRequestId)/threads?api-version=7.0" \\
                  -d "{\\"comments\\":[{\\"content\\":\\"## Terraform Plan\\\\n\`\`\`\\\\n\${PLAN:0:30000}\`\`\`\\"}],\\"status\\":1}"

  - stage: Apply
    displayName: Apply
    condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
    jobs:
      - deployment: TerraformApply
        environment: production   # manual approval gate here
        strategy:
          runOnce:
            deploy:
              steps:
                - checkout: self
                - task: AzureCLI@2
                  displayName: Terraform Apply
                  inputs:
                    azureSubscription: 'azure-service-connection'
                    scriptType: bash
                    scriptLocation: inlineScript
                    inlineScript: |
                      cd \$(TF_WORKING_DIR)
                      terraform init ...
                      terraform apply -auto-approve`,
    codeExplainer:`The pipeline has two stages: Validate (runs on every PR and push) and Apply (runs only on main branch, requires manual approval via the production environment). AzureCLI@2 tasks run with the service connection credentials injected as ARM_* env vars automatically. condition: eq(variables['Build.Reason'], 'PullRequest') ensures the PR comment step only runs on pull requests, not on direct pushes.`,
    warnings:[
      "Store Terraform variables with sensitive values as secret pipeline variables or in a library — never in YAML.",
      "The pipeline agent must have network access to Azure and to the storage account used as backend.",
      "terraform plan -out=tfplan saves the plan for apply — without -out, apply generates a new plan that may differ.",
      "Set the pipeline to fail on stderr: failOnStderr: true in AzureCLI tasks to catch Terraform errors properly.",
    ],
  },
  lab:{
    intro:"Set up an Azure DevOps project, connect it to your GitHub repo, and build the plan+apply pipeline with a manual approval gate.",
    steps:[
      { title:"Create Azure DevOps project", desc:`Go to dev.azure.com and create a free organisation.\nCreate a project: terraform-azure-learn.\n\nImport your GitHub repo:\nRepos → Import repository → enter your GitHub repo URL.\n\nOr connect directly: Pipelines → New pipeline → GitHub → select repo.` },
      { title:"Create service connection", desc:`Project Settings → Service connections → New service connection → Azure Resource Manager → Service Principal (automatic).\n\nGive it a name: azure-service-connection (must match the YAML).\n\nGrant it access to your subscription.\n\nMake sure to grant access to all pipelines.` },
      { title:"Create the production environment", desc:`Pipelines → Environments → New environment → name: production → type: None.\n\nClick the environment → Approvals and checks → Add → Approvals.\n\nAdd yourself as an approver.\n\nThis gate will pause the Apply stage until you manually approve.` },
      { title:"Add pipeline YAML and push", desc:`Create azure-pipelines.yml at the repo root (or in the environment directory).\n\nUse the code example above — update TF_WORKING_DIR, BACKEND_RG, BACKEND_SA to your values.\n\nPush to main:\ngit add azure-pipelines.yml\ngit commit -m "ci: add Terraform pipeline"\ngit push origin main\n\nIn Azure DevOps → Pipelines → New pipeline → select the YAML file.` },
      { title:"Test PR flow", desc:`Create a feature branch:\ngit checkout -b test/pipeline\n(make a small change — add a tag)\ngit push origin test/pipeline\n\nOpen a PR in GitHub/Azure Repos.\n\nThe pipeline runs automatically, posts the Terraform plan as a PR comment.\n\nMerge the PR → Apply stage runs → pauses for your approval → approve → apply completes.` },
    ],
  },
  challenge:{
    task:`Add a third pipeline stage called Drift-Detection that runs on a daily schedule (not on push). This stage runs terraform plan and fails the pipeline if there are any unexpected changes (drift between state and real Azure). Post the drift results to a Teams webhook. This simulates production drift detection that catches manual portal changes.`,
    hints:[
      `Add a schedules: block at the top: cron: "0 6 * * *" to run daily at 6 AM UTC`,
      `In the drift detection job run terraform plan -detailed-exitcode — exits with code 2 if changes detected`,
      `Capture exit code: set +e; terraform plan -detailed-exitcode; EXIT_CODE=$?`,
      `Post to Teams webhook with curl if EXIT_CODE == 2`,
    ],
    solution:`# Add to azure-pipelines.yml:
schedules:
  - cron: "0 6 * * *"
    displayName: Daily drift detection
    branches:
      include: [main]
    always: true

  - stage: DriftDetection
    displayName: Drift Detection
    condition: eq(variables['Build.Reason'], 'Schedule')
    jobs:
      - job: CheckDrift
        steps:
          - task: AzureCLI@2
            displayName: Detect Drift
            inputs:
              azureSubscription: 'azure-service-connection'
              scriptType: bash
              scriptLocation: inlineScript
              inlineScript: |
                cd \$(TF_WORKING_DIR)
                terraform init ...
                set +e
                terraform plan -detailed-exitcode -no-color > drift.txt 2>&1
                EXIT_CODE=\$?
                set -e
                if [ \$EXIT_CODE -eq 2 ]; then
                  echo "DRIFT DETECTED"
                  PLAN=\$(cat drift.txt)
                  curl -X POST "\$(TEAMS_WEBHOOK_URL)" \\
                    -H "Content-Type: application/json" \\
                    -d "{\\"text\\":\\"Infrastructure drift detected!\\\\n\`\`\`\${PLAN:0:1000}\`\`\`\\"}"
                  exit 1
                fi`,
  },
  deepDiveTopics:[
    "GitHub Actions vs Azure DevOps — choosing the right CI/CD platform",
    "OIDC authentication — passwordless pipeline auth to Azure",
    "Terraform plan size limits — handling large plans in PR comments",
    "Multi-environment pipelines — dev → staging → prod promotion",
    "Pipeline as code best practices — YAML template reuse",
    "Atlantis — pull request automation alternative to ADO pipelines",
  ],
},
// ─── DAY 29 ──────────────────────────────────────────────────────────────────
{
  id:29, phase:6, type:"advanced",
  title:"Terragrunt & DRY Patterns",
  subtitle:"Terragrunt config, dependency blocks, run-all, keeping code DRY",
  theory:{
    intro:`Terragrunt is a thin wrapper around Terraform that solves a specific problem: when you have 10 environments each with 5 components, you end up with 50 backend configurations and 50 provider blocks that are nearly identical. Terragrunt lets you define these once and inherit them everywhere. It also adds dependency management between components, run-all commands that operate across many configs simultaneously, and hooks for pre/post-apply scripts.`,
    concepts:[
      { title:"What Terragrunt Solves", body:`Problem: DRY (Don't Repeat Yourself) across many Terraform root modules. Duplicate backend configs, provider blocks, and common variables across dozens of directories. Solution: a root terragrunt.hcl that defines backend and provider config once, with include{} blocks in each component that inherit from the root. Change the backend location once — all 50 components pick it up automatically.` },
      { title:"terragrunt.hcl Structure", body:`Root terragrunt.hcl: defines generate{} blocks for backend.tf and provider.tf (Terragrunt writes these files into each component directory before running Terraform). Component terragrunt.hcl: includes the root config, defines component-specific inputs (variables), and declares dependencies on other components. The path_relative_to_include() and path_relative_to_root() functions build dynamic paths for backend keys.` },
      { title:"Dependency Blocks", body:`dependency "network" { config_path = "../networking" } declares that this component depends on the networking component. After networking runs Terragrunt fetches its outputs and makes them available as dependency.network.outputs.subnet_ids. This replaces terraform_remote_state data sources — cleaner syntax and Terragrunt handles the state fetching automatically.` },
      { title:"run-all Commands", body:`terragrunt run-all plan runs terraform plan in all components simultaneously (in dependency order). terragrunt run-all apply creates all components in the correct dependency order. terragrunt run-all destroy destroys in reverse order. This replaces manually cd-ing into each directory and running terraform separately. A full environment deploy becomes a single command.` },
      { title:"When to Use Terragrunt", body:`Use Terragrunt when: you manage multiple environments (5+) with similar components, you want dependency management between components without manually writing remote_state data sources, you want consistent backend config without copy-pasting. Skip Terragrunt when: you have one or two environments, you are using Terraform Cloud which solves the same problems differently, or your team is not familiar with it (learning curve is real).` },
    ],
    code:`# Root terragrunt.hcl (at repo root)
locals {
  env_vars    = read_terragrunt_config(find_in_parent_folders("env.hcl"))
  environment = local.env_vars.locals.environment
  location    = local.env_vars.locals.location
}

generate "backend" {
  path      = "backend.tf"
  if_exists = "overwrite"
  contents  = <<-EOF
    terraform {
      backend "azurerm" {
        resource_group_name  = "rg-tfstate"
        storage_account_name = "stterraformstate001"
        container_name       = "tfstate"
        key                  = "\${path_relative_to_include()}/terraform.tfstate"
        use_azuread_auth     = true
      }
    }
  EOF
}

generate "provider" {
  path      = "provider.tf"
  if_exists = "overwrite"
  contents  = <<-EOF
    provider "azurerm" { features {} }
    provider "azuread"  {}
  EOF
}

# environments/dev/env.hcl
locals {
  environment = "dev"
  location    = "East US"
}

# environments/dev/networking/terragrunt.hcl
include "root" {
  path = find_in_parent_folders()
}

inputs = {
  environment = local.environment  # from root locals
  location    = local.location
  vnet_cidr   = "10.0.0.0/16"
}

# environments/dev/compute/terragrunt.hcl
include "root" {
  path = find_in_parent_folders()
}

dependency "networking" {
  config_path = "../networking"
  mock_outputs = {
    subnet_ids = { app = "mock-id" }  # for plan before networking exists
  }
}

inputs = {
  subnet_id = dependency.networking.outputs.subnet_ids["app"]
  vm_size   = "Standard_B2s"
}

# Run all components in order:
# terragrunt run-all plan
# terragrunt run-all apply
# terragrunt run-all destroy`,
    codeExplainer:`generate "backend" writes a backend.tf file into each component directory before Terraform runs — the key uses path_relative_to_include() which returns the component's path relative to the root terragrunt.hcl, making each component get a unique state file path automatically. dependency blocks with mock_outputs allow running plan on the compute component before networking has been applied (Terragrunt uses the mocks instead of fetching real outputs).`,
    warnings:[
      "Terragrunt adds a layer of complexity — ensure your team is comfortable with plain Terraform before adding Terragrunt.",
      "terragrunt run-all apply runs all components — use --terragrunt-include-dir to limit scope.",
      "Generate blocks overwrite backend.tf and provider.tf — do not create these files manually in Terragrunt-managed directories.",
      "mock_outputs are only used for plan — never for apply. Ensure real outputs exist before applying dependent components.",
    ],
  },
  lab:{
    intro:"Wrap the Day 22 module library with Terragrunt to eliminate backend and provider duplication across environments.",
    steps:[
      { title:"Install Terragrunt", desc:`Windows: choco install terragrunt or download from github.com/gruntwork-io/terragrunt/releases\nLinux/Mac: brew install terragrunt\n\nVerify: terragrunt --version\n\nTerragrunt is a single binary like Terraform — no install beyond copying the binary.` },
      { title:"Create root terragrunt.hcl", desc:`At the repo root create terragrunt.hcl with:\n- generate "backend" block (dynamic key using path_relative_to_include)\n- generate "provider" block (azurerm and azuread providers)\n- locals reading from env.hcl files\n\nThis file is inherited by all component configs.` },
      { title:"Create env.hcl files", desc:`environments/dev/env.hcl:\nlocals {\n  environment = "dev"\n  location    = "East US"\n}\n\nenvironments/prod/env.hcl:\nlocals {\n  environment = "prod"\n  location    = "East US"\n}` },
      { title:"Create component terragrunt.hcl files", desc:`For each component (networking, keyvault, database, compute):\ncreate environments/dev/COMPONENT/terragrunt.hcl with:\n- include "root" { path = find_in_parent_folders() }\n- dependency blocks for upstream components\n- inputs = { ... } mapping dependency outputs to module variables\n\nDelete the old backend.tf and provider.tf files — Terragrunt generates them.` },
      { title:"Run with run-all", desc:`cd environments/dev\nterragrunt run-all plan\n\nTerragrunt discovers all component directories, resolves dependencies, and runs plan in the right order.\n\nterragrunt run-all apply\n\nAll components deploy in order. After: check Azure portal — same resources as before but now managed by Terragrunt.` },
    ],
  },
  challenge:{
    task:`Add a before_hook to the root terragrunt.hcl that runs terraform fmt -check -recursive before every plan and apply. If fmt check fails (code is not formatted) the hook should fail the Terragrunt run with an error message telling the user to run terraform fmt. Also add an after_hook that prints "Apply completed for COMPONENT_NAME" after every successful apply using the local component path.`,
    hints:[
      `before_hook "fmt_check" { commands = ["plan","apply"], execute = ["terraform","fmt","-check","-recursive"] }`,
      `run_on_error = false means the hook stops execution if it exits non-zero`,
      `after_hook "completion_message" { commands = ["apply"], execute = ["echo","Applied: \${path_relative_to_include()}"] }`,
      `Test by intentionally mis-formatting a .tf file and running terragrunt plan`,
    ],
    solution:`# Root terragrunt.hcl additions:
before_hook "fmt_check" {
  commands     = ["plan", "apply"]
  execute      = ["terraform", "fmt", "-check", "-recursive", "."]
  run_on_error = false
}

error_hook "fmt_error" {
  commands  = ["plan", "apply"]
  execute   = ["echo", "ERROR: Terraform files not formatted. Run: terraform fmt -recursive"]
  on_errors = [".*"]
}

after_hook "completion_message" {
  commands = ["apply"]
  execute  = ["echo", "SUCCESS: Applied \${path_relative_to_include()}"]
}`,
  },
  deepDiveTopics:[
    "Terragrunt vs Terraform workspaces — full comparison",
    "Terragrunt catalog — sharing component configs across teams",
    "Terragrunt mock_outputs — testing dependent components in isolation",
    "Large codebase organisation — monorepo patterns with Terragrunt",
    "Migrating from plain Terraform to Terragrunt",
    "Gruntwork modules — production-ready Terraform modules",
  ],
},
// ─── DAY 30 ──────────────────────────────────────────────────────────────────
{
  id:30, phase:6, type:"project",
  title:"CAPSTONE — Full Azure Landing Zone",
  subtitle:"Management groups, policies, hub-spoke, AKS, App Service, Sentinel, CI/CD",
  theory:{
    intro:`The Azure Landing Zone is Microsoft's prescribed architecture for enterprise Azure deployments. It defines management groups for governance hierarchy, Azure Policy for compliance enforcement, a hub-spoke network topology, identity management, and security monitoring — all before any workloads are deployed. Today you build a complete Landing Zone from scratch using Terraform, incorporating everything from the 30-day course: modules, remote state, workspaces, CI/CD, AKS, Sentinel, and policy-as-code.`,
    concepts:[
      { title:"Management Group Hierarchy", body:`Management groups sit above subscriptions in the Azure hierarchy: Tenant Root Group → Top-Level Management Group → Platform (Identity, Connectivity, Management) and Landing Zones (Corp, Online) management groups → Subscriptions. Azure Policy and RBAC assigned at management group level inherit down to all subscriptions and resources. In Terraform: azurerm_management_group, azurerm_management_group_subscription_association, azurerm_policy_assignment.` },
      { title:"Azure Policy as Code", body:`azurerm_policy_definition creates a custom policy (or use built-in policy definition IDs). azurerm_policy_set_definition groups multiple policies into an initiative. azurerm_management_group_policy_assignment assigns a policy or initiative to a management group — all subscriptions under that MG inherit the policy automatically. Policies with effect Deny block non-compliant resource creation. Audit effect logs without blocking. DeployIfNotExists auto-remediates.` },
      { title:"Platform Subscriptions", body:`Azure Landing Zone uses dedicated subscriptions: Management subscription (Log Analytics, Defender for Cloud, Sentinel, Automation), Connectivity subscription (hub VNet, Firewall, VPN/ExpressRoute gateway, DNS), Identity subscription (AD Domain Services, Key Vault for certificate management). Workload subscriptions connect to the hub via VNet peering. Terraform manages cross-subscription resources using provider aliases.` },
      { title:"Complete Architecture", body:`Everything from this course wired together: Management groups (Day 25 RBAC concepts) → Hub VNet with Firewall (Day 10) → Spoke VNets (Day 10) → AKS in spoke (Day 23) → App Service in spoke (Day 24) → SQL Database (Day 15) → Key Vault (Day 14) → Sentinel (Day 26) → Defender for Containers (Day 27) → Azure DevOps CI/CD pipeline (Day 28) → Terragrunt orchestration (Day 29).` },
      { title:"Landing Zone Terraform Repository", body:`Recommended structure: /management-groups (root-level governance), /connectivity (hub network), /identity (Entra ID config), /security (Sentinel, Defender), /workloads/spoke1 (business workload). Each directory is a Terragrunt component. One terragrunt run-all apply deploys the entire Landing Zone in dependency order. This is the reference architecture used in real enterprise Azure consultancy engagements.` },
    ],
    code:`# management-groups/main.tf
data "azurerm_management_group" "root" {
  name = data.azurerm_client_config.current.tenant_id
}

resource "azurerm_management_group" "platform" {
  display_name               = "Platform"
  parent_management_group_id = data.azurerm_management_group.root.id
}

resource "azurerm_management_group" "landingzones" {
  display_name               = "Landing Zones"
  parent_management_group_id = data.azurerm_management_group.root.id
}

resource "azurerm_management_group" "corp" {
  display_name               = "Corp"
  parent_management_group_id = azurerm_management_group.landingzones.id
}

# Custom policy — require tags on all resources
resource "azurerm_policy_definition" "require_tags" {
  name         = "require-resource-tags"
  policy_type  = "Custom"
  mode         = "Indexed"
  display_name = "Require environment and managed_by tags"

  metadata = jsonencode({ category = "Tags" })

  policy_rule = jsonencode({
    if = {
      anyOf = [
        { field = "tags['environment']", exists = "false" },
        { field = "tags['managed_by']",  exists = "false" }
      ]
    }
    then = { effect = "Deny" }
  })
}

resource "azurerm_management_group_policy_assignment" "require_tags" {
  name                 = "require-tags"
  management_group_id  = azurerm_management_group.landingzones.id
  policy_definition_id = azurerm_policy_definition.require_tags.id
  display_name         = "Require environment and managed_by tags on all resources"
  enforce              = true
}

# Policy — deny public blob access
resource "azurerm_management_group_policy_assignment" "no_public_blob" {
  name                 = "deny-public-blob"
  management_group_id  = azurerm_management_group.landingzones.id
  policy_definition_id = "/providers/Microsoft.Authorization/policyDefinitions/4fa4b6c0-31ca-4c0d-b10d-24b96f62a751"
  display_name         = "Deny public blob access on Storage Accounts"
  enforce              = true
}

output "platform_mg_id"     { value = azurerm_management_group.platform.id }
output "landingzones_mg_id" { value = azurerm_management_group.landingzones.id }
output "corp_mg_id"         { value = azurerm_management_group.corp.id }`,
    codeExplainer:`azurerm_management_group uses the tenant_id as the root management group name — every Azure tenant has exactly one root. The policy_rule is JSON-encoded HCL — it denies any resource creation where either required tag is missing. Assigning to the Landing Zones management group means the policy applies to all subscriptions under it automatically — you do not need to assign it per subscription. enforce = true means non-compliant resources are blocked, not just audited.`,
    warnings:[
      "Management group changes require elevated permissions — Global Administrator or Management Group Contributor.",
      "Policy assignments with enforce=true immediately block non-compliant resource creation — test with enforce=false first.",
      "Policy remediation tasks fix existing non-compliant resources but are not created automatically — add azurerm_resource_policy_remediation.",
      "Management group operations can take 10+ minutes to propagate through the Azure control plane.",
    ],
  },
  lab:{
    intro:"Build the complete Landing Zone: management group hierarchy, policy assignments, hub-spoke network, AKS workload, Sentinel, and CI/CD pipeline — all in a single Terragrunt-orchestrated repository.",
    steps:[
      { title:"Create the repository structure", desc:`Create this directory structure:\nlanding-zone/\n├── terragrunt.hcl (root)\n├── management-groups/\n│   ├── main.tf\n│   └── terragrunt.hcl\n├── connectivity/\n│   ├── main.tf (hub VNet, Bastion, Firewall)\n│   └── terragrunt.hcl\n├── security/\n│   ├── main.tf (Sentinel, Defender)\n│   └── terragrunt.hcl\n└── workloads/spoke1/\n    ├── main.tf (AKS, App Service, SQL)\n    └── terragrunt.hcl` },
      { title:"Deploy management groups and policies", desc:`cd management-groups\nterragrunt plan && terragrunt apply\n\nVerify in portal:\nAzure portal → Management groups\nYou should see Platform and Landing Zones under your tenant root.\n\nCheck policy assignments:\nManagement groups → Landing Zones → Policies\nRequire tags policy should appear as assigned.` },
      { title:"Deploy connectivity hub", desc:`cd connectivity\n(Add dependency on management-groups)\nterragrunt apply\n\nHub VNet with:\n- AzureBastionSubnet + Bastion\n- AzureFirewallSubnet + Firewall (Standard SKU)\n- GatewaySubnet (for future VPN)\n\nVerify hub VNet and all subnets in portal.` },
      { title:"Deploy security (Sentinel)", desc:`cd security\n(Add dependency on connectivity for log routing)\nterragrunt apply\n\nSentinel workspace onboarded.\nData connectors: Entra ID, Defender for Cloud.\nAnalytic rules: impossible travel, brute force, privileged container.` },
      { title:"Deploy spoke workload", desc:`cd workloads/spoke1\n(Dependencies: connectivity for VNet peering, security for monitoring)\nterragrunt apply\n\nSpoke VNet peered to hub.\nAKS cluster with Defender enabled.\nApp Service with Key Vault references.\nSQL Database.\n\nVerify all resources and peering status.` },
      { title:"Add CI/CD pipeline", desc:`Push the entire landing-zone/ repo to Azure DevOps.\n\nCreate the azure-pipelines.yml with:\n- PR stage: terragrunt run-all plan --terragrunt-non-interactive\n- Apply stage: terragrunt run-all apply with manual approval\n\nTest with a small change (add a tag) — verify plan appears in PR and apply runs on merge.` },
    ],
  },
  challenge:{
    task:`Add an Azure Policy that automatically deploys (DeployIfNotExists) a diagnostic setting to every new Log Analytics workspace in the Landing Zones management group, routing all logs to the central Sentinel workspace. This ensures any future workspace automatically contributes to your central SIEM. Create the policy definition, assignment, and a managed identity for policy remediation. Also create an initial remediation task for existing workspaces.`,
    hints:[
      `Policy effect: DeployIfNotExists requires roleDefinitionIds and a deployment template`,
      `The deployment template in the policy rule is an ARM template (JSON) that creates the diagnostic setting`,
      `Policy assignment needs identity { type = "SystemAssigned" } for DeployIfNotExists effects`,
      `azurerm_resource_policy_remediation triggers remediation for existing non-compliant resources`,
    ],
    solution:`resource "azurerm_policy_definition" "law_diagnostics" {
  name         = "deploy-law-diagnostics-to-sentinel"
  policy_type  = "Custom"
  mode         = "Indexed"
  display_name = "Deploy Log Analytics Workspace diagnostics to Sentinel"

  metadata = jsonencode({ category = "Monitoring" })

  parameters = jsonencode({
    sentinelWorkspaceId = { type = "String" }
  })

  policy_rule = jsonencode({
    if   = { field = "type", equals = "Microsoft.OperationalInsights/workspaces" }
    then = {
      effect = "DeployIfNotExists"
      details = {
        type = "Microsoft.Insights/diagnosticSettings"
        roleDefinitionIds = ["/providers/microsoft.authorization/roleDefinitions/b24988ac-6180-42a0-ab88-20f7382dd24c"]
        deployment = {
          properties = {
            mode     = "incremental"
            template = { "\$schema" = "...", resources = [] }
          }
        }
      }
    }
  })
}

resource "azurerm_management_group_policy_assignment" "law_diagnostics" {
  name                 = "deploy-law-diag"
  management_group_id  = azurerm_management_group.landingzones.id
  policy_definition_id = azurerm_policy_definition.law_diagnostics.id
  enforce              = true
  identity { type = "SystemAssigned" }
  parameters = jsonencode({
    sentinelWorkspaceId = { value = var.sentinel_workspace_id }
  })
  location = var.location
}

resource "azurerm_resource_policy_remediation" "law_diagnostics" {
  name                    = "remediate-law-diagnostics"
  scope                   = azurerm_management_group.landingzones.id
  policy_assignment_id    = azurerm_management_group_policy_assignment.law_diagnostics.id
  resource_discovery_mode = "ExistingNonCompliant"
}`,
  },
  deepDiveTopics:[
    "Azure Landing Zone Terraform accelerator — Microsoft's reference implementation",
    "Policy-as-code at enterprise scale — EPAC framework",
    "Multi-subscription Terraform — provider aliases and cross-sub resources",
    "Azure Verified Modules — Microsoft's curated module library",
    "Cost management at Landing Zone scale — budgets and alerts",
    "Day 2 operations — patching, backup, DR testing via Terraform",
  ],
},
];

module.exports = { phases, days };
