#!/bin/bash

# Claude Code Workspace Setup Script
# Created: 2025-07-30
# Purpose: Initialize and configure Claude Code workspace
# Usage: ./setup.sh [options]

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(dirname "$SCRIPT_DIR")"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S+00:00")
LOG_FILE="$WORKSPACE_ROOT/logs/setup.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level="$1"
    shift
    local message="$*"
    echo "[$TIMESTAMP] [$level] $message" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $*"
    log "INFO" "$*"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $*"
    log "SUCCESS" "$*"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $*"
    log "WARNING" "$*"
}

error() {
    echo -e "${RED}[ERROR]${NC} $*"
    log "ERROR" "$*"
}

# Help function
show_help() {
    cat << EOF
Claude Code Workspace Setup Script

Usage: $0 [OPTIONS]

OPTIONS:
    -h, --help              Show this help message
    -f, --force-rebuild     Force rebuild of all directories and files
    -c, --health-check      Run comprehensive health check
    -v, --verbose           Enable verbose output
    -q, --quiet             Suppress non-error output
    --skip-backup           Skip initial backup creation
    --skip-permissions      Skip permission setting
    --dry-run               Show what would be done without executing

EXAMPLES:
    $0                      # Standard setup
    $0 --force-rebuild      # Rebuild everything from scratch
    $0 --health-check       # Run health check only
    $0 --dry-run            # Preview setup actions

EOF
}

# Parse command line arguments
FORCE_REBUILD=false
HEALTH_CHECK=false
VERBOSE=false
QUIET=false
SKIP_BACKUP=false
SKIP_PERMISSIONS=false
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -f|--force-rebuild)
            FORCE_REBUILD=true
            shift
            ;;
        -c|--health-check)
            HEALTH_CHECK=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -q|--quiet)
            QUIET=true
            shift
            ;;
        --skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
        --skip-permissions)
            SKIP_PERMISSIONS=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        *)
            error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Dry run function
dry_run() {
    if [ "$DRY_RUN" = true ]; then
        echo "[DRY RUN] $*"
        return 0
    fi
    return 1
}

# Create directory structure
create_directories() {
    info "Creating directory structure..."
    
    local dirs=(
        "logs/sessions"
        "plans/current"
        "plans/completed"
        "plans/templates"
        "plans/archive"
        "artifacts/code/components"
        "artifacts/code/scripts"
        "artifacts/code/analysis"
        "artifacts/code/prototypes"
        "artifacts/documents/reports"
        "artifacts/documents/specifications"
        "artifacts/documents/presentations"
        "artifacts/visualizations"
        "artifacts/exports"
        "cache/web_searches"
        "cache/file_analysis"
        "cache/api_responses"
        "cache/temp"
        "config/templates"
        "config/workflows"
        "data/inputs"
        "data/processed"
        "data/outputs"
        "data/backups"
        "workspace/drafts"
        "workspace/experiments"
        "workspace/scratch"
        "workspace/tests"
        "scripts"
        "monitoring"
        "meta"
    )
    
    for dir in "${dirs[@]}"; do
        local full_path="$WORKSPACE_ROOT/$dir"
        if dry_run "mkdir -p '$full_path'"; then
            continue
        fi
        
        if [ ! -d "$full_path" ] || [ "$FORCE_REBUILD" = true ]; then
            mkdir -p "$full_path"
            [ "$VERBOSE" = true ] && info "Created directory: $dir"
        fi
    done
    
    success "Directory structure created successfully"
}

# Set permissions
set_permissions() {
    if [ "$SKIP_PERMISSIONS" = true ]; then
        warning "Skipping permission setting"
        return
    fi
    
    info "Setting appropriate permissions..."
    
    if dry_run "chmod -R 755 '$WORKSPACE_ROOT'"; then
        return
    fi
    
    # Set directory permissions
    find "$WORKSPACE_ROOT" -type d -exec chmod 755 {} \;
    
    # Set file permissions
    find "$WORKSPACE_ROOT" -type f -exec chmod 644 {} \;
    
    # Set script permissions
    find "$WORKSPACE_ROOT/scripts" -name "*.sh" -exec chmod +x {} \;
    
    success "Permissions set successfully"
}

# Create initial log files
create_log_files() {
    info "Creating initial log files..."
    
    local log_files=(
        "logs/decisions.md"
        "logs/errors.md" 
        "logs/performance.md"
    )
    
    for log_file in "${log_files[@]}"; do
        local full_path="$WORKSPACE_ROOT/$log_file"
        if dry_run "touch '$full_path'"; then
            continue
        fi
        
        if [ ! -f "$full_path" ] || [ "$FORCE_REBUILD" = true ]; then
            case "$log_file" in
                "logs/decisions.md")
                    cat > "$full_path" << 'EOF'
# Decision Log
**Created**: {TIMESTAMP}
**Last Updated**: {TIMESTAMP}

## Decision Template
```markdown
### Decision ID: DEC-YYYY-MM-DD-XXX
**Date**: YYYY-MM-DD
**Context**: Brief description of the situation requiring a decision
**Decision**: The decision that was made
**Rationale**: Why this decision was made
**Alternatives Considered**: Other options that were evaluated
**Impact**: Expected impact of this decision
**Review Date**: When this decision should be reviewed
**Status**: Active | Superseded | Archived
```

## Decisions Log

EOF
                    ;;
                "logs/errors.md")
                    cat > "$full_path" << 'EOF'
# Error Log
**Created**: {TIMESTAMP}
**Last Updated**: {TIMESTAMP}

## Error Template
```markdown
### Error ID: ERR-YYYY-MM-DD-XXX
**Date**: YYYY-MM-DD HH:MM:SS
**Severity**: Critical | High | Medium | Low
**Component**: Component or service where error occurred
**Error Description**: Detailed description of the error
**Stack Trace**: Technical details and stack trace
**Impact**: How this error affects the system or users
**Resolution**: Steps taken to resolve the error
**Prevention**: Measures to prevent similar errors
**Status**: Open | In Progress | Resolved | Closed
```

## Error Log

EOF
                    ;;
                "logs/performance.md")
                    cat > "$full_path" << 'EOF'
# Performance Log
**Created**: {TIMESTAMP}
**Last Updated**: {TIMESTAMP}

## Performance Metrics Template
```markdown
### Metric ID: PERF-YYYY-MM-DD-XXX
**Date**: YYYY-MM-DD HH:MM:SS
**Component**: Component or operation measured
**Metric Type**: Response Time | Throughput | Resource Usage | Error Rate
**Baseline**: Previously established baseline value
**Current Value**: Current measured value
**Trend**: Improving | Stable | Degrading
**Analysis**: Analysis of performance data
**Optimization**: Recommended optimizations
**Status**: Baseline | Monitoring | Action Required
```

## Performance Metrics

EOF
                    ;;
            esac
            
            # Replace timestamp placeholder
            sed -i "s/{TIMESTAMP}/$TIMESTAMP/g" "$full_path"
            [ "$VERBOSE" = true ] && info "Created log file: $log_file"
        fi
    done
    
    success "Log files created successfully"
}

# Create plan files
create_plan_files() {
    info "Creating plan management files..."
    
    local plan_files=(
        "plans/current/active_plan.md"
        "plans/current/backlog.md"
        "plans/current/blocked.md"
    )
    
    for plan_file in "${plan_files[@]}"; do
        local full_path="$WORKSPACE_ROOT/$plan_file"
        if dry_run "create plan file '$full_path'"; then
            continue
        fi
        
        if [ ! -f "$full_path" ] || [ "$FORCE_REBUILD" = true ]; then
            case "$plan_file" in
                "plans/current/active_plan.md")
                    cat > "$full_path" << 'EOF'
# Active Implementation Plan
**Created**: {TIMESTAMP}
**Last Updated**: {TIMESTAMP}
**Status**: Active
**Priority**: High

## Current Project: Enterprise CRM System

### Phase 3: Implementation & Development (40% of timeline)
**Progress**: 60% complete
**Estimated Completion**: 2025-08-15

#### Active Tasks
- [ ] Restore Clients Service (Priority: Critical)
- [ ] Configure Frontend Production Deployment (Priority: High)
- [ ] Implement Health Check Endpoints (Priority: Medium)
- [ ] Add Request Rate Limiting (Priority: Medium)

#### Completed Tasks
- [x] Fix Users Service network binding
- [x] Fix Products Service network binding
- [x] Optimize frontend search functionality
- [x] Generate comprehensive implementation workflow
- [x] Update project documentation

#### Next Milestones
1. **Complete Missing Services** (Target: 2025-08-05)
2. **Security & Monitoring Setup** (Target: 2025-08-10)
3. **Testing Framework Implementation** (Target: 2025-08-15)

EOF
                    ;;
                "plans/current/backlog.md")
                    cat > "$full_path" << 'EOF'
# Project Backlog
**Created**: {TIMESTAMP}
**Last Updated**: {TIMESTAMP}

## High Priority Items
- [ ] PDF Service integration and testing
- [ ] Comprehensive API documentation (Swagger)
- [ ] Automated testing framework setup
- [ ] Performance optimization and database indexing
- [ ] Centralized logging and monitoring

## Medium Priority Items
- [ ] CI/CD pipeline implementation
- [ ] Security hardening (HTTPS, headers, validation)
- [ ] Backup and recovery procedures
- [ ] Load testing and performance benchmarking
- [ ] User interface improvements

## Low Priority Items
- [ ] Advanced analytics and reporting
- [ ] Mobile application development
- [ ] Third-party integrations
- [ ] Advanced search functionality
- [ ] Notification system

## Technical Debt
- [ ] Code refactoring for maintainability
- [ ] Database migration to latest version
- [ ] Dependency updates and security patches
- [ ] Documentation improvements
- [ ] Test coverage improvements

EOF
                    ;;
                "plans/current/blocked.md")
                    cat > "$full_path" << 'EOF'
# Blocked Items
**Created**: {TIMESTAMP}
**Last Updated**: {TIMESTAMP}

## Currently Blocked Items

### BLOCKED-001: Clients Service Integration
**Blocked Since**: 2025-07-30
**Reason**: Service currently disabled in docker-compose.yml
**Blocker Type**: Configuration
**Impact**: High - Client management functionality unavailable
**Resolution Plan**: Uncomment service, apply network binding fix, test integration
**Owner**: Development Team
**Target Resolution**: 2025-07-31

### BLOCKED-002: PDF Service Deployment
**Blocked Since**: 2025-07-30
**Reason**: Service commented out, integration requirements unclear
**Blocker Type**: Requirements/Technical
**Impact**: Medium - PDF analysis functionality unavailable
**Resolution Plan**: Review requirements, update configuration, test integration
**Owner**: Development Team
**Target Resolution**: 2025-08-05

## Recently Resolved
- **RESOLVED-001**: Users Service network binding (Resolved: 2025-07-30)
- **RESOLVED-002**: Products Service network binding (Resolved: 2025-07-30)
- **RESOLVED-003**: Frontend search performance (Resolved: 2025-07-30)

## Prevention Measures
- Regular service health checks
- Automated integration testing
- Configuration validation scripts
- Documentation updates for all changes

EOF
                    ;;
            esac
            
            # Replace timestamp placeholder
            sed -i "s/{TIMESTAMP}/$TIMESTAMP/g" "$full_path"
            [ "$VERBOSE" = true ] && info "Created plan file: $plan_file"
        fi
    done
    
    success "Plan files created successfully"
}

# Create monitoring files
create_monitoring_files() {
    info "Creating monitoring files..."
    
    local monitoring_dir="$WORKSPACE_ROOT/monitoring"
    
    # Create metrics.json
    local metrics_file="$monitoring_dir/metrics.json"
    if dry_run "create metrics file '$metrics_file'"; then
        return
    fi
    
    if [ ! -f "$metrics_file" ] || [ "$FORCE_REBUILD" = true ]; then
        cat > "$metrics_file" << 'EOF'
{
  "workspace": {
    "version": "1.0.0",
    "created": "{TIMESTAMP}",
    "last_updated": "{TIMESTAMP}"
  },
  "performance": {
    "setup_time_seconds": 0,
    "last_health_check": "{TIMESTAMP}",
    "health_status": "healthy",
    "disk_usage_mb": 0,
    "memory_usage_mb": 0
  },
  "usage": {
    "total_sessions": 0,
    "total_plans_created": 0,
    "total_artifacts_generated": 0,
    "total_errors_logged": 0
  },
  "quality": {
    "plan_completion_rate": 0.0,
    "error_resolution_rate": 0.0,
    "performance_trend": "stable"
  }
}
EOF
        sed -i "s/{TIMESTAMP}/$TIMESTAMP/g" "$metrics_file"
        [ "$VERBOSE" = true ] && info "Created metrics file"
    fi
    
    # Create health_check.md
    local health_file="$monitoring_dir/health_check.md"
    if [ ! -f "$health_file" ] || [ "$FORCE_REBUILD" = true ]; then
        cat > "$health_file" << 'EOF'
# Workspace Health Check
**Last Check**: {TIMESTAMP}
**Status**: Healthy

## Directory Structure
- [ ] All required directories exist
- [ ] Permissions are set correctly
- [ ] No unauthorized files present

## Configuration Files
- [ ] claude.md exists and is valid
- [ ] status.md exists and is current
- [ ] preferences.json is valid JSON
- [ ] .claudeignore is properly configured

## Log Files
- [ ] Log files are accessible
- [ ] No critical errors in error log
- [ ] Performance metrics within thresholds
- [ ] Disk usage within limits

## Plan Management
- [ ] Plan templates are available
- [ ] Active plans are current
- [ ] Blocked items are tracked
- [ ] Backlog is maintained

## Artifacts
- [ ] Artifact directories are organized
- [ ] No corrupted files
- [ ] Backup system is functional
- [ ] Version control integration working

## Scripts
- [ ] All scripts have execute permissions
- [ ] Scripts run without errors
- [ ] Backup system is operational
- [ ] Cleanup procedures work

## Performance
- [ ] Response times are acceptable
- [ ] Memory usage is reasonable
- [ ] Disk space is sufficient
- [ ] No resource leaks detected

## Security
- [ ] No sensitive data exposed
- [ ] File permissions are appropriate
- [ ] No unauthorized access
- [ ] Backup encryption working (if enabled)

---
**Next Check**: {NEXT_CHECK}
**Check Frequency**: Daily
EOF
        
        local next_check=$(date -u -d "+1 day" +"%Y-%m-%dT%H:%M:%S+00:00")
        sed -i "s/{TIMESTAMP}/$TIMESTAMP/g" "$health_file"
        sed -i "s/{NEXT_CHECK}/$next_check/g" "$health_file"
        [ "$VERBOSE" = true ] && info "Created health check file"
    fi
    
    success "Monitoring files created successfully"
}

# Create meta files
create_meta_files() {
    info "Creating meta files..."
    
    local meta_dir="$WORKSPACE_ROOT/meta"
    
    # Create changelog.md
    local changelog_file="$meta_dir/changelog.md"
    if [ ! -f "$changelog_file" ] || [ "$FORCE_REBUILD" = true ]; then
        cat > "$changelog_file" << 'EOF'
# Workspace Changelog
**Created**: {TIMESTAMP}

## Version 1.0.0 - 2025-07-30

### Added
- Complete Claude Code workspace structure
- Core configuration files (claude.md, status.md, README.md)
- Comprehensive plan management system
- Logging and monitoring framework
- Template system for plans and documents
- Utility scripts for setup, backup, and maintenance
- Artifact management and organization
- Performance monitoring and health checks
- Polish language support
- Security and error handling procedures

### Changed
- N/A (Initial release)

### Deprecated
- N/A (Initial release)

### Removed
- N/A (Initial release)

### Fixed
- N/A (Initial release)

### Security
- Secure file permissions and access control
- Sensitive data protection patterns
- Encrypted backup support (configurable)

---

## Changelog Format
This changelog follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

### Categories
- **Added** for new features
- **Changed** for changes in existing functionality
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** for vulnerability fixes and security improvements
EOF
        sed -i "s/{TIMESTAMP}/$TIMESTAMP/g" "$changelog_file"
        [ "$VERBOSE" = true ] && info "Created changelog file"
    fi
    
    success "Meta files created successfully"
}

# Create symlinks
create_symlinks() {
    info "Creating convenience symlinks..."
    
    local links=(
        "logs/sessions/latest.md:logs/sessions/session_$(date +%Y%m%d).md"
        "plans/current/current.md:plans/current/active_plan.md"
        "artifacts/latest:artifacts/code"
    )
    
    for link_def in "${links[@]}"; do
        local link_path="${link_def%:*}"
        local target_path="${link_def#*:}"
        local full_link_path="$WORKSPACE_ROOT/$link_path"
        local full_target_path="$WORKSPACE_ROOT/$target_path"
        
        if dry_run "ln -sf '$target_path' '$link_path'"; then
            continue
        fi
        
        # Create target file if it doesn't exist
        if [ ! -f "$full_target_path" ] && [[ "$target_path" == *.md ]]; then
            touch "$full_target_path"
        fi
        
        # Create symlink
        if [ -L "$full_link_path" ] || [ "$FORCE_REBUILD" = true ]; then
            rm -f "$full_link_path"
        fi
        
        if [ ! -e "$full_link_path" ]; then
            ln -sf "$(basename "$target_path")" "$full_link_path"
            [ "$VERBOSE" = true ] && info "Created symlink: $link_path -> $target_path"
        fi
    done
    
    success "Symlinks created successfully"
}

# Run health check
run_health_check() {
    info "Running comprehensive health check..."
    
    local health_score=0
    local total_checks=0
    
    # Check directory structure
    info "Checking directory structure..."
    local required_dirs=(
        "logs" "plans" "artifacts" "cache" "config" 
        "data" "workspace" "scripts" "monitoring" "meta"
    )
    
    for dir in "${required_dirs[@]}"; do
        total_checks=$((total_checks + 1))
        if [ -d "$WORKSPACE_ROOT/$dir" ]; then
            health_score=$((health_score + 1))
            [ "$VERBOSE" = true ] && success "Directory exists: $dir"
        else
            error "Missing directory: $dir"
        fi
    done
    
    # Check configuration files
    info "Checking configuration files..."
    local config_files=(
        "claude.md" "status.md" "README.md" ".claudeignore" 
        "config/preferences.json"
    )
    
    for file in "${config_files[@]}"; do
        total_checks=$((total_checks + 1))
        if [ -f "$WORKSPACE_ROOT/$file" ]; then
            health_score=$((health_score + 1))
            [ "$VERBOSE" = true ] && success "Configuration file exists: $file"
        else
            error "Missing configuration file: $file"
        fi
    done
    
    # Check script permissions
    info "Checking script permissions..."
    find "$WORKSPACE_ROOT/scripts" -name "*.sh" | while read -r script; do
        total_checks=$((total_checks + 1))
        if [ -x "$script" ]; then
            health_score=$((health_score + 1))
            [ "$VERBOSE" = true ] && success "Script is executable: $(basename "$script")"
        else
            error "Script not executable: $(basename "$script")"
        fi
    done
    
    # Calculate health percentage
    if [ $total_checks -gt 0 ]; then
        local health_percentage=$((health_score * 100 / total_checks))
        info "Health check completed: $health_score/$total_checks checks passed ($health_percentage%)"
        
        if [ $health_percentage -ge 90 ]; then
            success "Workspace health: EXCELLENT"
        elif [ $health_percentage -ge 75 ]; then
            warning "Workspace health: GOOD"
        elif [ $health_percentage -ge 50 ]; then
            warning "Workspace health: FAIR"
        else
            error "Workspace health: POOR"
        fi
    else
        warning "No health checks performed"
    fi
}

# Create initial backup
create_initial_backup() {
    if [ "$SKIP_BACKUP" = true ]; then
        warning "Skipping initial backup creation"
        return
    fi
    
    info "Creating initial backup..."
    
    local backup_dir="$WORKSPACE_ROOT/data/backups"
    local backup_file="$backup_dir/initial_setup_$(date +%Y%m%d_%H%M%S).tar.gz"
    
    if dry_run "tar -czf '$backup_file' -C '$WORKSPACE_ROOT' ."; then
        return
    fi
    
    mkdir -p "$backup_dir"
    tar -czf "$backup_file" -C "$WORKSPACE_ROOT" \
        --exclude="data/backups" \
        --exclude="cache/temp" \
        --exclude="workspace/scratch" \
        .
    
    success "Initial backup created: $(basename "$backup_file")"
}

# Main setup function
main() {
    local start_time=$(date +%s)
    
    if [ "$QUIET" != true ]; then
        cat << 'EOF'
  ______ _                 _        ____            _      
 / _____)| |               | |      / ___)          | |     
| /     | | ____ _   _  __| | ____| /     ___   ___| |  ___
| |     | |/ _  | | | |/ _  |/ ___) |    / _ \ / _ \ | / _ \
| \_____| ( ( | | |_| ( (_| ( (___| \___| |_| | |_| | |  __/
 \______)_|\_||_|____/ \____|\___|\_____/\___/ \___/|_|\___|

Claude Code Workspace Setup
Version: 1.0.0
Created: 2025-07-30

EOF
    fi
    
    info "Starting workspace setup..."
    info "Workspace root: $WORKSPACE_ROOT"
    info "Timestamp: $TIMESTAMP"
    
    # Create log directory first
    mkdir -p "$(dirname "$LOG_FILE")"
    
    if [ "$HEALTH_CHECK" = true ]; then
        run_health_check
        exit 0
    fi
    
    # Run setup steps
    create_directories
    create_log_files
    create_plan_files
    create_monitoring_files
    create_meta_files
    set_permissions
    create_symlinks
    create_initial_backup
    
    # Final health check
    if [ "$DRY_RUN" != true ]; then
        run_health_check
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    success "Workspace setup completed successfully in ${duration} seconds"
    
    if [ "$QUIET" != true ]; then
        cat << EOF

Next Steps:
1. Review configuration in claude.md
2. Check current status in status.md
3. Read the README.md for usage instructions
4. Run './scripts/backup.sh' to create a backup
5. Start using Claude Code with plan mode: claude --plan "your task"

Workspace is ready for use!
EOF
    fi
}

# Run main function
main "$@"