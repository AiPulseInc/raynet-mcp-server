# GitHub Project Board Setup Guide

This guide will help you set up the GitHub Project Board for tracking Raynet MCP Server development sprints.

## Quick Setup (Automated)

### Prerequisites
- GitHub CLI installed: https://cli.github.com/
- Authenticated with GitHub: `gh auth login`

### Create Project Board

```bash
# Navigate to repository
cd raynet-mcp-server

# Create the project board
gh project create --owner AiPulseInc --title "Raynet MCP Server - Sprint Board" --format board

# Or use the web interface (recommended for first-time setup)
```

## Manual Setup (Web Interface)

### Step 1: Create New Project

1. Go to: https://github.com/orgs/AiPulseInc/projects (or your profile projects)
2. Click **"New project"**
3. Select **"Board"** template
4. Name: **"Raynet MCP Server - Sprint Board"**
5. Description: **"Sprint tracking for Raynet CRM MCP Server implementation (26-day MVP)"**

### Step 2: Configure Columns

Create the following columns (drag to reorder):

| Column Name | Purpose | Automation |
|------------|---------|------------|
| **📋 Backlog** | All planned work not yet started | None |
| **🎯 Sprint 0: Setup** | Days 1-2 - Project setup | Auto-add issues with label `sprint-0` |
| **🔍 Sprint 0.5: Discovery** | Day 3 - API validation | Auto-add issues with label `sprint-0.5` |
| **🏗️ Sprint 1: Infrastructure** | Days 4-6 - Core infrastructure | Auto-add issues with label `sprint-1` |
| **🏢 Sprint 2: Companies** | Days 7-10 - Company tools | Auto-add issues with label `sprint-2` |
| **👥 Sprint 3: Contacts** | Days 11-14 - Contact tools | Auto-add issues with label `sprint-3` |
| **💼 Sprint 4: Deals** | Days 15-18 - Deal tools | Auto-add issues with label `sprint-4` |
| **🧪 Sprint 5: Integration** | Days 19-23 - Testing | Auto-add issues with label `sprint-5` |
| **✨ Sprint 6: Production** | Days 24-26 - Launch | Auto-add issues with label `sprint-6` |
| **✅ Done** | Completed work | Auto-move when issue closed |

### Step 3: Add Custom Fields

Add these custom fields to track additional metadata:

| Field Name | Type | Options |
|-----------|------|---------|
| **Status** | Single select | Not Started, In Progress, Blocked, Done |
| **Priority** | Single select | Critical, High, Medium, Low |
| **Sprint** | Single select | Sprint 0, Sprint 0.5, Sprint 1-6 |
| **Effort** | Number | Story points (1, 2, 3, 5, 8, 13) |
| **Assignee** | Person | (auto-populated) |
| **Due Date** | Date | (for sprint deadlines) |

### Step 4: Configure Automations

Set up these automations:

1. **Auto-add new issues**
   - When: Issue opened
   - Then: Add to Backlog column

2. **Auto-move on label**
   - When: Label added (sprint-0, sprint-1, etc.)
   - Then: Move to corresponding sprint column

3. **Auto-move on close**
   - When: Issue closed
   - Then: Move to Done column

4. **Auto-move on reopen**
   - When: Issue reopened
   - Then: Move to Backlog

### Step 5: Create Sprint Milestones

Create GitHub milestones for each sprint:

```bash
# Sprint 0: Project Setup (Days 1-2)
gh milestone create "Sprint 0: Setup" --due-date "2026-02-02" --description "Project initialization and infrastructure setup"

# Sprint 0.5: API Discovery (Day 3)
gh milestone create "Sprint 0.5: Discovery" --due-date "2026-02-03" --description "Raynet API validation and configuration discovery"

# Sprint 1: Infrastructure (Days 4-6)
gh milestone create "Sprint 1: Infrastructure" --due-date "2026-02-06" --description "Core infrastructure and authentication"

# Sprint 2: Companies (Days 7-10)
gh milestone create "Sprint 2: Companies" --due-date "2026-02-10" --description "Company management tools"

# Sprint 3: Contacts (Days 11-14)
gh milestone create "Sprint 3: Contacts" --due-date "2026-02-14" --description "Contact management tools"

# Sprint 4: Deals (Days 15-18)
gh milestone create "Sprint 4: Deals" --due-date "2026-02-18" --description "Deal/Business Case management tools"

# Sprint 5: Integration (Days 19-23)
gh milestone create "Sprint 5: Integration" --due-date "2026-02-23" --description "End-to-end integration and testing"

# Sprint 6: Production (Days 24-26)
gh milestone create "Sprint 6: Production" --due-date "2026-02-26" --description "Production deployment and polish"
```

### Step 6: Create Initial Issues

Run the issue creation script (see below) or manually create issues from templates.

## Issue Templates

The repository includes issue templates for:
- 🐛 Bug Report
- ✨ Feature Request
- 📋 Sprint Task
- 🧪 Test Case
- 📚 Documentation

## Automated Issue Creation Script

Create all sprint tasks automatically:

```bash
# Install GitHub CLI if needed
brew install gh  # macOS
# or
sudo apt install gh  # Ubuntu/Debian

# Run the setup script
./scripts/create-sprint-issues.sh
```

## Project Board Views

Create these saved views:

### 1. Current Sprint View
- Filter: Status = "In Progress" OR Status = "Not Started"
- Group by: Sprint
- Sort by: Priority (descending)

### 2. Blocked Items View
- Filter: Status = "Blocked"
- Sort by: Priority (descending)

### 3. Team Member View
- Group by: Assignee
- Sort by: Due Date

### 4. Timeline View
- Layout: Roadmap
- Group by: Sprint
- X-axis: Due Date

## Sprint Management Best Practices

### Daily Updates
- Move cards as work progresses
- Update Status field (Not Started → In Progress → Done)
- Add comments for blockers

### Sprint Planning
- Review Backlog before each sprint
- Assign story points (Effort field)
- Set realistic due dates
- Assign team members

### Sprint Review
- Move all completed items to Done
- Review blocked items
- Update sprint burndown
- Create next sprint issues

## Project Board Metrics

Track these metrics weekly:

- **Velocity**: Story points completed per sprint
- **Burndown**: Remaining work vs. time
- **Cycle Time**: Time from start to completion
- **Blocked Time**: Time spent in Blocked status

## Links

- Project Board: https://github.com/orgs/AiPulseInc/projects/[NUMBER]
- Issues: https://github.com/AiPulseInc/raynet-mcp-server/issues
- Milestones: https://github.com/AiPulseInc/raynet-mcp-server/milestones
- Wiki: https://github.com/AiPulseInc/raynet-mcp-server/wiki

## Support

For questions about project board setup:
- GitHub Projects Docs: https://docs.github.com/en/issues/planning-and-tracking-with-projects
- Issue tracking best practices: https://github.com/AiPulseInc/raynet-mcp-server/wiki/Issue-Tracking
