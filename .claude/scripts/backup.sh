#!/bin/bash

# Claude Code Workspace Backup Script
# Created: 2025-07-30
# Purpose: Create and manage backups of the Claude Code workspace
# Usage: ./backup.sh [options]

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$WORKSPACE_ROOT")"
TIMESTAMP=$(date -u +"%Y%m%d_%H%M%S")
BACKUP_DIR="$WORKSPACE_ROOT/data/backups"
LOG_FILE="$WORKSPACE_ROOT/logs/backup.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default settings
BACKUP_TYPE="incremental"
COMPRESSION="gzip"
INCLUDE_PROJECT=false
INCLUDE_CACHE=false
VERBOSE=false
DRY_RUN=false
RESTORE_MODE=false
LIST_BACKUPS=false
CLEANUP_OLD=false
ENCRYPT_BACKUP=false
ENCRYPTION_KEY=""

# Logging function
log() {
    local level="$1"
    shift
    local message="$*"
    local log_timestamp=$(date -u +"%Y-%m-%dT%H:%M:%S+00:00")
    echo "[$log_timestamp] [$level] $message" | tee -a "$LOG_FILE"
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
Claude Code Workspace Backup Script

Usage: $0 [OPTIONS]

OPTIONS:
    -h, --help              Show this help message
    -t, --type TYPE         Backup type: full, incremental, differential (default: incremental)
    -c, --compression TYPE  Compression: gzip, bzip2, xz, none (default: gzip)
    -p, --include-project   Include entire project directory
    -e, --include-cache     Include cache directories
    -v, --verbose           Enable verbose output
    -d, --dry-run           Show what would be backed up without creating backup
    -r, --restore DATE      Restore from backup (format: YYYYMMDD_HHMMSS)
    -l, --list              List all available backups
    -k, --cleanup           Remove backups older than 30 days
    --encrypt KEY           Encrypt backup with provided key
    --no-compression        Disable compression (same as -c none)

BACKUP TYPES:
    full                    Complete backup of all files
    incremental             Only files changed since last backup
    differential            Files changed since last full backup

EXAMPLES:
    $0                      # Create incremental backup
    $0 -t full -v           # Create full backup with verbose output
    $0 -p -e                # Include project and cache directories
    $0 -r 20250730_143000   # Restore from specific backup
    $0 -l                   # List all backups
    $0 -k                   # Cleanup old backups

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -t|--type)
            BACKUP_TYPE="$2"
            shift 2
            ;;
        -c|--compression)
            COMPRESSION="$2"
            shift 2
            ;;
        -p|--include-project)
            INCLUDE_PROJECT=true
            shift
            ;;
        -e|--include-cache)
            INCLUDE_CACHE=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -r|--restore)
            RESTORE_MODE=true
            RESTORE_DATE="$2"
            shift 2
            ;;
        -l|--list)
            LIST_BACKUPS=true
            shift
            ;;
        -k|--cleanup)
            CLEANUP_OLD=true
            shift
            ;;
        --encrypt)
            ENCRYPT_BACKUP=true
            ENCRYPTION_KEY="$2"
            shift 2
            ;;
        --no-compression)
            COMPRESSION="none"
            shift
            ;;
        *)
            error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Validate backup type
if [[ ! "$BACKUP_TYPE" =~ ^(full|incremental|differential)$ ]]; then
    error "Invalid backup type: $BACKUP_TYPE"
    exit 1
fi

# Validate compression type
if [[ ! "$COMPRESSION" =~ ^(gzip|bzip2|xz|none)$ ]]; then
    error "Invalid compression type: $COMPRESSION"
    exit 1
fi

# Create backup directory
create_backup_dir() {
    info "Creating backup directory structure..."
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # Create backup manifest directory
    mkdir -p "$BACKUP_DIR/manifests"
    
    success "Backup directory structure created"
}

# Get compression extension and command
get_compression_info() {
    case $COMPRESSION in
        gzip)
            COMPRESSION_EXT=".tar.gz"
            COMPRESSION_CMD="tar -czf"
            DECOMPRESSION_CMD="tar -xzf"
            ;;
        bzip2)
            COMPRESSION_EXT=".tar.bz2"
            COMPRESSION_CMD="tar -cjf"
            DECOMPRESSION_CMD="tar -xjf"
            ;;
        xz)
            COMPRESSION_EXT=".tar.xz"
            COMPRESSION_CMD="tar -cJf"
            DECOMPRESSION_CMD="tar -xJf"
            ;;
        none)
            COMPRESSION_EXT=".tar"
            COMPRESSION_CMD="tar -cf"
            DECOMPRESSION_CMD="tar -xf"
            ;;
    esac
}

# Generate backup filename
generate_backup_filename() {
    local backup_name="workspace_${BACKUP_TYPE}_${TIMESTAMP}"
    
    if [ "$INCLUDE_PROJECT" = true ]; then
        backup_name="${backup_name}_with_project"
    fi
    
    if [ "$INCLUDE_CACHE" = true ]; then
        backup_name="${backup_name}_with_cache"
    fi
    
    BACKUP_FILENAME="${backup_name}${COMPRESSION_EXT}"
    
    if [ "$ENCRYPT_BACKUP" = true ]; then
        BACKUP_FILENAME="${BACKUP_FILENAME}.enc"
    fi
}

# Create file list for backup
create_file_list() {
    local file_list_path="$BACKUP_DIR/file_list_${TIMESTAMP}.txt"
    
    info "Creating file list for $BACKUP_TYPE backup..."
    
    # Base files to include
    cat > "$file_list_path" << EOF
claude.md
status.md
README.md
.claudeignore
config/
plans/
logs/
artifacts/
data/inputs/
data/processed/
data/outputs/
workspace/
scripts/
monitoring/
meta/
EOF

    # Add cache if requested
    if [ "$INCLUDE_CACHE" = true ]; then
        echo "cache/" >> "$file_list_path"
    fi
    
    # Add project files if requested
    if [ "$INCLUDE_PROJECT" = true ]; then
        info "Including project files in backup..."
        # Add project-specific files, excluding certain directories
        find "$PROJECT_ROOT" -type f \
            -not -path "*/.git/*" \
            -not -path "*/node_modules/*" \
            -not -path "*/__pycache__/*" \
            -not -path "*/dist/*" \
            -not -path "*/build/*" \
            -not -path "*/.claude/cache/temp/*" \
            >> "$file_list_path"
    fi
    
    # Handle incremental/differential backups
    if [ "$BACKUP_TYPE" != "full" ]; then
        local reference_date
        if [ "$BACKUP_TYPE" = "incremental" ]; then
            # Find last backup
            reference_date=$(find "$BACKUP_DIR" -name "*.tar*" -type f -printf "%T@\t%f\n" | sort -n | tail -1 | cut -f2 | sed 's/.*_\([0-9]\{8\}_[0-9]\{6\}\).*/\1/')
        else
            # Find last full backup
            reference_date=$(find "$BACKUP_DIR" -name "*_full_*.tar*" -type f -printf "%T@\t%f\n" | sort -n | tail -1 | cut -f2 | sed 's/.*_\([0-9]\{8\}_[0-9]\{6\}\).*/\1/')
        fi
        
        if [ -n "$reference_date" ]; then
            info "Creating $BACKUP_TYPE backup since $reference_date"
            # Filter files modified since reference date
            local temp_list="$BACKUP_DIR/temp_file_list_${TIMESTAMP}.txt"
            while IFS= read -r file; do
                if [ -f "$WORKSPACE_ROOT/$file" ] && [ "$WORKSPACE_ROOT/$file" -nt "$BACKUP_DIR" ]; then
                    echo "$file" >> "$temp_list"
                fi
            done < "$file_list_path"
            mv "$temp_list" "$file_list_path"
        else
            warning "No reference backup found, creating full backup instead"
            BACKUP_TYPE="full"
        fi
    fi
    
    FILE_LIST_PATH="$file_list_path"
    
    if [ "$VERBOSE" = true ]; then
        local file_count=$(wc -l < "$file_list_path")
        info "File list created with $file_count entries"
    fi
}

# Create backup manifest
create_backup_manifest() {
    local manifest_file="$BACKUP_DIR/manifests/manifest_${TIMESTAMP}.json"
    
    cat > "$manifest_file" << EOF
{
  "backup_info": {
    "timestamp": "$TIMESTAMP",
    "type": "$BACKUP_TYPE",
    "compression": "$COMPRESSION",
    "encrypted": $ENCRYPT_BACKUP,
    "include_project": $INCLUDE_PROJECT,
    "include_cache": $INCLUDE_CACHE,
    "filename": "$BACKUP_FILENAME",
    "created_by": "$(whoami)",
    "hostname": "$(hostname)",
    "backup_size_bytes": 0,
    "file_count": 0
  },
  "workspace_info": {
    "version": "1.0.0",
    "project_root": "$PROJECT_ROOT",
    "workspace_root": "$WORKSPACE_ROOT"
  },
  "file_list": []
}
EOF
    
    MANIFEST_FILE="$manifest_file"
}

# Update backup manifest with file information
update_backup_manifest() {
    local backup_size=$(stat -f%z "$BACKUP_DIR/$BACKUP_FILENAME" 2>/dev/null || stat -c%s "$BACKUP_DIR/$BACKUP_FILENAME" 2>/dev/null || echo "0")
    local file_count=$(wc -l < "$FILE_LIST_PATH")
    
    # Update manifest with actual information
    python3 -c "
import json
import os

manifest_file = '$MANIFEST_FILE'
backup_size = $backup_size
file_count = $file_count

with open(manifest_file, 'r') as f:
    manifest = json.load(f)

manifest['backup_info']['backup_size_bytes'] = backup_size
manifest['backup_info']['file_count'] = file_count

# Add file list
with open('$FILE_LIST_PATH', 'r') as f:
    manifest['file_list'] = [line.strip() for line in f.readlines()]

with open(manifest_file, 'w') as f:
    json.dump(manifest, f, indent=2)
" 2>/dev/null || warning "Could not update manifest file"
}

# Create backup
create_backup() {
    info "Starting $BACKUP_TYPE backup..."
    
    create_backup_dir
    get_compression_info
    generate_backup_filename
    create_file_list
    create_backup_manifest
    
    local backup_path="$BACKUP_DIR/$BACKUP_FILENAME"
    
    if [ "$DRY_RUN" = true ]; then
        info "DRY RUN: Would create backup $BACKUP_FILENAME"
        info "Files to be backed up:"
        cat "$FILE_LIST_PATH"
        return 0
    fi
    
    # Create the backup
    cd "$WORKSPACE_ROOT"
    
    if [ "$VERBOSE" = true ]; then
        info "Creating backup archive..."
        $COMPRESSION_CMD "$backup_path" -T "$FILE_LIST_PATH" --verbose
    else
        $COMPRESSION_CMD "$backup_path" -T "$FILE_LIST_PATH"
    fi
    
    # Encrypt if requested
    if [ "$ENCRYPT_BACKUP" = true ]; then
        info "Encrypting backup..."
        openssl enc -aes-256-cbc -salt -in "$backup_path" -out "${backup_path}.enc" -k "$ENCRYPTION_KEY"
        rm "$backup_path"
        backup_path="${backup_path}.enc"
    fi
    
    # Update manifest
    update_backup_manifest
    
    # Cleanup temporary files
    rm -f "$FILE_LIST_PATH"
    
    # Calculate and display backup size
    local backup_size_mb=$(($(stat -f%z "$backup_path" 2>/dev/null || stat -c%s "$backup_path") / 1024 / 1024))
    
    success "Backup created successfully: $(basename "$backup_path")"
    info "Backup size: ${backup_size_mb}MB"
    info "Backup location: $backup_path"
    
    # Update global backup manifest
    update_global_manifest
}

# Update global backup manifest
update_global_manifest() {
    local global_manifest="$BACKUP_DIR/backup_manifest.json"
    
    if [ ! -f "$global_manifest" ]; then
        cat > "$global_manifest" << EOF
{
  "workspace_backups": {
    "last_updated": "$TIMESTAMP",
    "backup_count": 0,
    "total_size_bytes": 0,
    "backups": []
  }
}
EOF
    fi
    
    # Add this backup to global manifest
    python3 -c "
import json
import os

global_manifest = '$global_manifest'
backup_manifest = '$MANIFEST_FILE'

with open(global_manifest, 'r') as f:
    global_data = json.load(f)

with open(backup_manifest, 'r') as f:
    backup_data = json.load(f)

# Add backup info to global manifest
global_data['workspace_backups']['backups'].append(backup_data['backup_info'])
global_data['workspace_backups']['backup_count'] = len(global_data['workspace_backups']['backups'])
global_data['workspace_backups']['last_updated'] = '$TIMESTAMP'

# Calculate total size
total_size = sum(backup['backup_size_bytes'] for backup in global_data['workspace_backups']['backups'])
global_data['workspace_backups']['total_size_bytes'] = total_size

with open(global_manifest, 'w') as f:
    json.dump(global_data, f, indent=2)
" 2>/dev/null || warning "Could not update global manifest"
}

# List backups
list_backups() {
    info "Available backups:"
    
    if [ ! -d "$BACKUP_DIR" ] || [ ! "$(ls -A "$BACKUP_DIR"/*.tar* 2>/dev/null)" ]; then
        warning "No backups found"
        return 0
    fi
    
    printf "%-20s %-12s %-10s %-15s %-10s\n" "DATE" "TYPE" "SIZE" "COMPRESSION" "ENCRYPTED"
    printf "%-20s %-12s %-10s %-15s %-10s\n" "----" "----" "----" "-----------" "---------"
    
    for backup in "$BACKUP_DIR"/*.tar*; do
        if [ -f "$backup" ]; then
            local basename=$(basename "$backup")
            local backup_date=$(echo "$basename" | sed 's/.*_\([0-9]\{8\}_[0-9]\{6\}\).*/\1/' | sed 's/_/ /')
            local backup_type=$(echo "$basename" | sed 's/.*_\(full\|incremental\|differential\)_.*/\1/')
            local backup_size_mb=$(($(stat -f%z "$backup" 2>/dev/null || stat -c%s "$backup") / 1024 / 1024))
            local compression=$(echo "$basename" | sed 's/.*\.\(tar\.\|tar$\)/\1/' | sed 's/tar\.//' | sed 's/tar/none/')
            local encrypted="No"
            
            if [[ "$basename" == *.enc ]]; then
                encrypted="Yes"
            fi
            
            printf "%-20s %-12s %-10s %-15s %-10s\n" "$backup_date" "$backup_type" "${backup_size_mb}MB" "$compression" "$encrypted"
        fi
    done
}

# Restore backup
restore_backup() {
    local restore_pattern="*_${RESTORE_DATE}*"
    local backup_file=$(find "$BACKUP_DIR" -name "$restore_pattern" -type f | head -1)
    
    if [ -z "$backup_file" ]; then
        error "No backup found for date: $RESTORE_DATE"
        exit 1
    fi
    
    info "Found backup: $(basename "$backup_file")"
    
    # Confirm restore
    echo -n "This will overwrite existing workspace files. Continue? (y/N): "
    read -r confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        info "Restore cancelled"
        exit 0
    fi
    
    # Create restore backup
    info "Creating backup of current state before restore..."
    BACKUP_TYPE="pre_restore"
    TIMESTAMP="$(date -u +"%Y%m%d_%H%M%S")"
    create_backup
    
    # Decrypt if needed
    local restore_file="$backup_file"
    if [[ "$backup_file" == *.enc ]]; then
        info "Decrypting backup..."
        if [ -z "$ENCRYPTION_KEY" ]; then
            echo -n "Enter encryption key: "
            read -s ENCRYPTION_KEY
            echo
        fi
        restore_file="${backup_file%.enc}"
        openssl enc -aes-256-cbc -d -in "$backup_file" -out "$restore_file" -k "$ENCRYPTION_KEY"
    fi
    
    # Determine decompression command
    get_compression_info
    
    # Restore files
    info "Restoring from backup..."
    cd "$WORKSPACE_ROOT"
    
    if [ "$VERBOSE" = true ]; then
        $DECOMPRESSION_CMD "$restore_file" --verbose
    else
        $DECOMPRESSION_CMD "$restore_file"
    fi
    
    # Cleanup decrypted file if it was encrypted
    if [[ "$backup_file" == *.enc ]] && [ -f "$restore_file" ]; then
        rm "$restore_file"
    fi
    
    success "Backup restored successfully from $(basename "$backup_file")"
    info "Pre-restore backup created for rollback if needed"
}

# Cleanup old backups
cleanup_old_backups() {
    info "Cleaning up backups older than 30 days..."
    
    local cleanup_count=0
    local current_time=$(date +%s)
    local thirty_days_ago=$((current_time - 30 * 24 * 3600))
    
    for backup in "$BACKUP_DIR"/*.tar*; do
        if [ -f "$backup" ]; then
            local backup_time=$(stat -f%m "$backup" 2>/dev/null || stat -c%Y "$backup")
            if [ "$backup_time" -lt "$thirty_days_ago" ]; then
                if [ "$VERBOSE" = true ]; then
                    info "Removing old backup: $(basename "$backup")"
                fi
                rm "$backup"
                cleanup_count=$((cleanup_count + 1))
            fi
        fi
    done
    
    # Cleanup old manifests
    for manifest in "$BACKUP_DIR/manifests"/*.json; do
        if [ -f "$manifest" ]; then
            local manifest_time=$(stat -f%m "$manifest" 2>/dev/null || stat -c%Y "$manifest")
            if [ "$manifest_time" -lt "$thirty_days_ago" ]; then
                rm "$manifest"
            fi
        fi
    done
    
    if [ $cleanup_count -gt 0 ]; then
        success "Cleaned up $cleanup_count old backups"
        update_global_manifest
    else
        info "No old backups found to cleanup"
    fi
}

# Main execution
main() {
    # Create log directory
    mkdir -p "$(dirname "$LOG_FILE")"
    
    info "Claude Code Workspace Backup Script started"
    info "Workspace: $WORKSPACE_ROOT"
    info "Backup directory: $BACKUP_DIR"
    
    if [ "$LIST_BACKUPS" = true ]; then
        list_backups
    elif [ "$RESTORE_MODE" = true ]; then
        restore_backup
    elif [ "$CLEANUP_OLD" = true ]; then
        cleanup_old_backups
    else
        create_backup
    fi
    
    success "Backup script completed successfully"
}

# Run main function
main "$@"