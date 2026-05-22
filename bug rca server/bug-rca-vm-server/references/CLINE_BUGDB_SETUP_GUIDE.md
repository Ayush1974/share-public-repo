# Cline + Custom BugDB MCP Server

> Historical note: the current shared Bug RCA package does not require a live BugDB MCP server for BugDB workflow guidance. The active package flow uses bundled `references/BUGINTWFLOW.md` and `references/.clinerules`. Keep this document only as an archival setup reference for older environments that still choose to run a custom BugDB MCP server.
## Setup and Usage Guide

This document explains how to configure **Cline (VS Code)** to connect to the **Custom BugDB MCP Server** and use it to perform **bug analysis using the Bug Investigation workflow**.

---

# 1. Prerequisites

Ensure the following are installed before proceeding.

## 1.1 Visual Studio Code

Download and install VS Code:

https://code.visualstudio.com/

## 1.2 Cline Extension

Install the Cline extension from the VS Code Marketplace.

Steps:

1. Open **VS Code**
2. Click **Extensions**
3. Search for **Cline**
4. Click **Install**
5. Restart VS Code if prompted

---

# 2. Download the Integration Package

Download the package:

**Cline + BugDB MCP Integration**

Unzip the folder locally.

Example location:

C:\Simphony\BugDB\Cline + BugDB MCP Integration\

The folder contains the following files:

BUGINTWFLOW.md  
cline_mcp_settings.json  
BugDBToken.postman_collection.json  
CLINE_BUGDB_SETUP_GUIDE.md  

---
# 3. Open the Integration Folder in VS Code

After extracting the package, open the folder in **VS Code** so that the workflow file can be detected by Cline.

Steps:

1. Open **VS Code**
2. Click:

File → Open Folder

3. Select the unzipped folder:

C:\Simphony\BugDB\Cline + BugDB MCP Integration\

4. Click **Open**

This ensures that the following files are available in the same workspace:

BUGINTWFLOW.md  
cline_mcp_settings.json  
BugDBToken.postman_collection.json  

Opening the folder in VS Code is important because the prompt:

/BugIntwflow.md

references the **BUGINTWFLOW.md file from the current workspace directory**.  
If the folder is not opened in VS Code, Cline may not detect the workflow file.

Alternatively, you can place BUGINTWFLOW.md in the root folder of your VS Code project/workspace.
This ensures that when using the prompt /BugIntwflow.md, Cline can locate and load the workflow instructions from the workspace.

# 4. Configure the BugDB MCP Server in Cline

## Step 1 – Open MCP Configuration

1. Open **VS Code**
2. Open **Cline**
3. Navigate to:

Cline → MCP Servers

4. Click:

Edit Configuration

This opens the **Cline MCP configuration JSON file**.

---

## Step 2 – Add MCP Server Configuration

1. Open the file:

cline_mcp_settings.json

2. Copy the block:

"mcp-server-custom": {
    ...
}

3. Paste this block into the **Cline MCP configuration JSON**.

If other MCP servers already exist, add this entry alongside them.

---

## Step 3 – Add Authorization Token

Update the authorization header with your IDCS token.

Example:

Authorization: Bearer <your_IDCS_token>

Replace `<your_IDCS_token>` with the token generated using Postman.

Security Notes:

- Do **not share bearer tokens**
- Do **not commit tokens to repositories**
- Treat tokens as **confidential credentials**

Save the configuration file after updating the token.

---

# 5. Generate IDCS Token Using Postman

The integration package includes a Postman collection:

BugDBToken.postman_collection.json

The IDCS token is generated using the **OAuth flow in Postman by clicking "Get New Access Token"**.

## Steps

1. Open **Postman**

2. Click **Import**

3. Import the file:

BugDBToken.postman_collection.json

4. Open the request that calls the IDCS token endpoint:

POST /oauth2/v1/token

5. Navigate to the **Authorization** tab.

6. Ensure the **Auth Type** is set to:

OAuth 2.0

7. Click:

Get New Access Token

8. Postman will request a token from **Oracle IDCS**.

9. After the request succeeds, Postman will display the **Access Token**.

10. Copy the **Access Token**.

Example token format:

eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...

11. Update the **Cline MCP configuration** with the token.

Example:

Authorization: Bearer <access_token>

Replace `<access_token>` with the copied token.

---

# 6. Token Expiry

The **IDCS token expires in approximately 1 hour**.

When the token expires:

1. Generate a new token using the **Postman collection**
2. Update the Authorization header in the MCP configuration

If the token is expired or invalid, you may see errors such as:

401 Unauthorized  
403 Forbidden

---

# 7. Verify MCP Server Connectivity

After completing the configuration:

1. Open:

Cline → MCP Servers

2. Confirm the server

mcp-server-custom

is listed and **Enabled**.

If your Cline version provides a **Test** or **Refresh** option, run it.

If issues occur, verify:

- Token validity
- Authorization header
- MCP configuration
- Network connectivity

---

# 8. Bug Investigation Workflow

Before running bug analysis, review the workflow instructions in:

BUGINTWFLOW.md

This file defines the **bug investigation workflow**.

The workflow retrieves:

- Bug header/details
- Bug comments
- Bug history / audit trail
- Attachments list
- Relevant log / text / CSV attachments

The expected output includes:

- Bug analysis
- Root cause (only if supported by evidence)
- Workaround
- Recommended resolution

If any information cannot be retrieved, it must be **explicitly called out instead of guessing**.

---

# 9. Example Prompts

## End-to-End Bug Analysis

Example prompt:

Analyze Bug <BUG#> end-to-end. Retrieve header/details, comments, history/audit, and attachments (download and inspect logs/text/csv). Provide bug analysis, root cause (only if supported by evidence), workaround, and recommended resolution.

Example Cline commands:

/BugIntwflow.md Get bug analysis for bug number 38608450

/BugIntwflow.md Perform root cause analysis for 38452205 and find similar bugs and provide analysis and workaround.

---

## Exception / Log Analysis

Example prompt:

For Bug <BUG#>, download all attachments and identify the exact exception(s) or error signatures. Correlate with comments and history timeline to determine likely trigger conditions.

---

## Related / Pattern Analysis

Examples:

/BugIntwflow.md Find similar bugs related to ORA-00001: unique constraint

/BugIntwflow.md Find similar bugs having the issue "Nullable object must have a value"

/BugIntwflow.md List out the issues reported on 19.9 release segregated by "STARBUCKS" customer in the same product

/BugIntwflow.md List out the issues reported on 19.9 release segregated by customers in the same product

---

# 10. Security Guidelines

Follow these security practices:

- Treat **Bearer tokens as confidential**
- Do **not share tokens**
- Do **not commit tokens to repositories**
- Ensure MCP configuration complies with internal security policies

---
