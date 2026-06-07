# n8n Credentials Management Skill

Automated setup and management of n8n cloud credentials for GitHub and Web Research.

## Description

This skill manages n8n cloud credentials, including:
- GitHub API credentials for repository access
- Web Research configuration
- Credential validation and testing
- Automated credential creation via multiple methods

## When to Use

Use this skill when:
- Setting up n8n credentials for GitHub integration
- Configuring Web Research capabilities
- Testing n8n credential connectivity
- Managing credential lifecycle

## Capabilities

- ✅ GitHub credential setup
- ✅ Web Research configuration
- ✅ Credential validation
- ✅ Multiple setup methods (API, CLI, manual guide)
- ✅ Credential testing
- ✅ Error handling and fallbacks

## Usage

### Setup GitHub Credential
```bash
.\.devin\skills\n8n-credentials\skill.ps1 -SetupGitHub
```

### Setup Web Research
```bash
.\.devin\skills\n8n-credentials\skill.ps1 -SetupWebResearch
```

### Test Credentials
```bash
.\.devin\skills\n8n-credentials\skill.ps1 -Test
```

### List Credentials
```bash
.\.devin\skills\n8n-credentials\skill.ps1 -List
```

## Parameters

- `-SetupGitHub`: Setup GitHub credential
- `-SetupWebResearch`: Setup Web Research configuration
- `-Test`: Test credential connectivity
- `-List`: List existing credentials
- `-Method <method>`: Override setup method (api, cli, manual)

## Notes

- Requires n8n cloud API key in .env
- GitHub token must be valid
- Web Research uses DuckDuckGo (no API key needed)
- Fallback to manual setup if API fails