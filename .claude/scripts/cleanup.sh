#!/bin/bash

# Claude Code Workspace Cleanup Script
# Created: 2025-07-30
# Purpose: Maintain and cleanup the Claude Code workspace
# Usage: ./cleanup.sh [options]

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(dirname "$SCRIPT_DIR")"
TIMESTAMP=$(date -u +"%Y%m%d_%H%M%S")
LOG_FILE="$WORKSPACE_ROOT/logs/cleanup.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default settings
DRY_RUN=false
VERBOSE=false
AGGRESSIVE=false
CLEAN_CACHE=true
CLEAN_LOGS=true
CLEAN_TEMP=true
CLEAN_BACKUPS=false
COMPRESS_LOGS=true
OPTIMIZE_ARTIFACTS=true

# Cleanup thresholds
MAX_LOG_SIZE_MB=10
MAX_CACHE_SIZE_MB=100
LOG_RETENTION_DAYS=30
CACHE_RETENTION_DAYS=7
TEMP_RETENTION_HOURS=24
BACKUP_RETENTION_DAYS=90

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
Claude Code Workspace Cleanup Script

Usage: $0 [OPTIONS]

OPTIONS:
    -h, --help              Show this help message
    -d, --dry-run           Show what would be cleaned without performing cleanup
    -v, --verbose           Enable verbose output
    -a, --aggressive        Enable aggressive cleanup (removes more files)
    --cache-only            Clean only cache directories
    --logs-only             Clean only log files
    --temp-only             Clean only temporary files
    --no-cache              Skip cache cleanup
    --no-logs               Skip log cleanup
    --no-temp               Skip temporary file cleanup
    --no-compression        Skip log compression
    --no-optimization       Skip artifact optimization
    --clean-backups         Include old backup cleanup
    --max-log-size SIZE     Maximum log file size in MB (default: $MAX_LOG_SIZE_MB)
    --log-retention DAYS    Log retention in days (default: $LOG_RETENTION_DAYS)
    --cache-retention DAYS  Cache retention in days (default: $CACHE_RETENTION_DAYS)
    --temp-retention HOURS  Temp file retention in hours (default: $TEMP_RETENTION_HOURS)

CLEANUP CATEGORIES:
    Cache               Temporary cached data, search results, API responses
    Logs                Large log files, old session logs, error logs
    Temporary           Scratch files, temporary processing files
    Artifacts           Duplicate artifacts, empty directories
    Backups             Old backup files (with --clean-backups)

EXAMPLES:
    $0                      # Standard cleanup
    $0 -d -v                # Dry run with verbose output
    $0 -a                   # Aggressive cleanup
    $0 --cache-only         # Clean only cache
    $0 --clean-backups      # Include backup cleanup

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -a|--aggressive)
            AGGRESSIVE=true
            shift
            ;;
        --cache-only)
            CLEAN_CACHE=true
            CLEAN_LOGS=false
            CLEAN_TEMP=false
            OPTIMIZE_ARTIFACTS=false
            shift
            ;;
        --logs-only)
            CLEAN_CACHE=false
            CLEAN_LOGS=true
            CLEAN_TEMP=false
            OPTIMIZE_ARTIFACTS=false
            shift
            ;;
        --temp-only)
            CLEAN_CACHE=false
            CLEAN_LOGS=false
            CLEAN_TEMP=true
            OPTIMIZE_ARTIFACTS=false
            shift
            ;;
        --no-cache)
            CLEAN_CACHE=false
            shift
            ;;
        --no-logs)
            CLEAN_LOGS=false
            shift
            ;;
        --no-temp)
            CLEAN_TEMP=false
            shift
            ;;
        --no-compression)
            COMPRESS_LOGS=false
            shift
            ;;
        --no-optimization)
            OPTIMIZE_ARTIFACTS=false
            shift
            ;;
        --clean-backups)
            CLEAN_BACKUPS=true
            shift
            ;;
        --max-log-size)
            MAX_LOG_SIZE_MB="$2"
            shift 2
            ;;
        --log-retention)
            LOG_RETENTION_DAYS="$2"
            shift 2
            ;;
        --cache-retention)
            CACHE_RETENTION_DAYS="$2"
            shift 2
            ;;
        --temp-retention)
            TEMP_RETENTION_HOURS="$2"
            shift 2
            ;;
        *)
            error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Get file size in MB
get_size_mb() {
    local file="$1"
    if [ -f "$file" ]; then
        local size_bytes=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo "0")
        echo $((size_bytes / 1024 / 1024))
    else
        echo "0"
    fi
}

# Get directory size in MB
get_dir_size_mb() {
    local dir="$1"
    if [ -d "$dir" ]; then
        local size_bytes=$(du -sb "$dir" 2>/dev/null | cut -f1 || echo "0")
        echo $((size_bytes / 1024 / 1024))
    else
        echo "0"
    fi
}

# Check if file is older than specified days
is_older_than_days() {
    local file="$1"
    local days="$2"
    local current_time=$(date +%s)
    local threshold_time=$((current_time - days * 24 * 3600))
    local file_time=$(stat -f%m "$file" 2>/dev/null || stat -c%Y "$file" 2>/dev/null || echo "0")
    
    [ "$file_time" -lt "$threshold_time" ]
}

# Check if file is older than specified hours
is_older_than_hours() {
    local file="$1"
    local hours="$2"
    local current_time=$(date +%s)
    local threshold_time=$((current_time - hours * 3600))
    local file_time=$(stat -f%m "$file" 2>/dev/null || stat -c%Y "$file" 2>/dev/null || echo "0")
    
    [ "$file_time" -lt "$threshold_time" ]
}

# Clean cache directories
clean_cache() {
    if [ "$CLEAN_CACHE" != true ]; then
        return 0
    fi
    
    info "Cleaning cache directories..."
    
    local cache_dirs=(
        "cache/temp"
        "cache/web_searches" 
        "cache/file_analysis"
        "cache/api_responses"
    )
    
    local total_cleaned=0
    local total_size_cleaned=0
    
    for cache_dir in "${cache_dirs[@]}"; do
        local full_path="$WORKSPACE_ROOT/$cache_dir"
        
        if [ ! -d "$full_path" ]; then
            continue
        fi
        
        local dir_size_before=$(get_dir_size_mb "$full_path")
        local files_cleaned=0
        
        info "Processing $cache_dir..."
        
        # Clean old cache files
        while IFS= read -r -d '' file; do
            if is_older_than_days "$file" "$CACHE_RETENTION_DAYS"; then
                if [ "$VERBOSE" = true ]; then
                    info "Removing old cache file: $(basename "$file")"
                fi
                
                if [ "$DRY_RUN" != true ]; then
                    rm -f "$file"
                fi
                
                files_cleaned=$((files_cleaned + 1))
            fi
        done < <(find "$full_path" -type f -print0 2>/dev/null || true)
        
        # Aggressive mode: clean larger cache files
        if [ "$AGGRESSIVE" = true ]; then
            while IFS= read -r -d '' file; do
                local file_size_mb=$(get_size_mb "$file")
                if [ "$file_size_mb" -gt 5 ]; then
                    if [ "$VERBOSE" = true ]; then
                        info "Removing large cache file: $(basename "$file") (${file_size_mb}MB)"
                    fi
                    
                    if [ "$DRY_RUN" != true ]; then
                        rm -f "$file"
                    fi
                    
                    files_cleaned=$((files_cleaned + 1))
                fi
            done < <(find "$full_path" -type f -print0 2>/dev/null || true)
        fi
        
        # Remove empty directories
        if [ "$DRY_RUN" != true ]; then
            find "$full_path" -type d -empty -delete 2>/dev/null || true
        fi
        
        local dir_size_after=$(get_dir_size_mb "$full_path")
        local size_cleaned=$((dir_size_before - dir_size_after))
        
        if [ $files_cleaned -gt 0 ]; then
            success "Cleaned $files_cleaned files from $cache_dir (${size_cleaned}MB freed)"
            total_cleaned=$((total_cleaned + files_cleaned))
            total_size_cleaned=$((total_size_cleaned + size_cleaned))
        fi
    done
    
    if [ $total_cleaned -gt 0 ]; then
        success "Cache cleanup completed: $total_cleaned files removed, ${total_size_cleaned}MB freed"
    else
        info "No cache files needed cleaning"
    fi
}

# Clean and compress log files
clean_logs() {
    if [ "$CLEAN_LOGS" != true ]; then
        return 0
    fi
    
    info "Cleaning log files..."
    
    local log_dirs=(
        "logs"
        "logs/sessions"
    )
    
    local total_cleaned=0
    local total_compressed=0
    local total_size_freed=0
    
    for log_dir in "${log_dirs[@]}"; do
        local full_path="$WORKSPACE_ROOT/$log_dir"
        
        if [ ! -d "$full_path" ]; then
            continue
        fi
        
        info "Processing $log_dir..."
        
        # Clean old log files
        while IFS= read -r -d '' file; do
            if is_older_than_days "$file" "$LOG_RETENTION_DAYS"; then
                local file_size_mb=$(get_size_mb "$file")
                
                if [ "$VERBOSE" = true ]; then
                    info "Removing old log file: $(basename "$file") (${file_size_mb}MB)"
                fi
                
                if [ "$DRY_RUN" != true ]; then
                    rm -f "$file"
                fi
                
                total_cleaned=$((total_cleaned + 1))
                total_size_freed=$((total_size_freed + file_size_mb))
            fi
        done < <(find "$full_path" -name "*.log" -o -name "*.md" -type f -print0 2>/dev/null || true)
        
        # Compress large log files
        if [ "$COMPRESS_LOGS" = true ]; then
            while IFS= read -r -d '' file; do
                local file_size_mb=$(get_size_mb "$file")
                
                if [ "$file_size_mb" -gt "$MAX_LOG_SIZE_MB" ] && [[ "$file" != *.gz ]]; then
                    if [ "$VERBOSE" = true ]; then
                        info "Compressing large log file: $(basename "$file") (${file_size_mb}MB)"
                    fi
                    
                    if [ "$DRY_RUN" != true ]; then
                        gzip "$file"
                    fi
                    
                    total_compressed=$((total_compressed + 1))
                fi
            done < <(find "$full_path" -name "*.log" -o -name "*.md" -type f -print0 2>/dev/null || true)
        fi
        
        # Aggressive mode: remove non-critical logs
        if [ "$AGGRESSIVE" = true ]; then
            local non_critical_patterns=(
                "*debug*"
                "*trace*"
                "*verbose*"
                "session_*"
            )
            
            for pattern in "${non_critical_patterns[@]}"; do
                while IFS= read -r -d '' file; do
                    if is_older_than_days "$file" $((LOG_RETENTION_DAYS / 2)); then
                        local file_size_mb=$(get_size_mb "$file")
                        
                        if [ "$VERBOSE" = true ]; then
                            info "Removing non-critical log: $(basename "$file")"
                        fi
                        
                        if [ "$DRY_RUN" != true ]; then
                            rm -f "$file"
                        fi
                        
                        total_cleaned=$((total_cleaned + 1))
                        total_size_freed=$((total_size_freed + file_size_mb))
                    fi
                done < <(find "$full_path" -name "$pattern" -type f -print0 2>/dev/null || true)
            done
        fi
    done
    
    if [ $total_cleaned -gt 0 ] || [ $total_compressed -gt 0 ]; then
        success "Log cleanup completed: $total_cleaned files removed, $total_compressed files compressed, ${total_size_freed}MB freed"
    else
        info "No log files needed cleaning"
    fi
}

# Clean temporary files
clean_temp() {
    if [ "$CLEAN_TEMP" != true ]; then
        return 0
    fi
    
    info "Cleaning temporary files..."
    
    local temp_locations=(
        "workspace/scratch"
        "workspace/experiments"
        "workspace/tests"
        "data/temp"
        "cache/temp"
    )
    
    local temp_patterns=(
        "*.tmp"
        "*.temp"
        "*.swp"
        "*.swo"
        "*~"
        ".DS_Store"
        "Thumbs.db"
        "desktop.ini"
        "*.cache"
        "draft_*"
        "temp_*"
        "_temp_*"
        "*.draft"
    )
    
    local total_cleaned=0
    local total_size_freed=0
    
    # Clean from specific directories
    for temp_dir in "${temp_locations[@]}"; do
        local full_path="$WORKSPACE_ROOT/$temp_dir"
        
        if [ ! -d "$full_path" ]; then
            continue
        fi
        
        info "Processing temporary files in $temp_dir..."
        
        while IFS= read -r -d '' file; do
            if is_older_than_hours "$file" "$TEMP_RETENTION_HOURS"; then
                local file_size_mb=$(get_size_mb "$file")
                
                if [ "$VERBOSE" = true ]; then
                    info "Removing temp file: $(basename "$file")"
                fi
                
                if [ "$DRY_RUN" != true ]; then
                    rm -f "$file"
                fi
                
                total_cleaned=$((total_cleaned + 1))
                total_size_freed=$((total_size_freed + file_size_mb))
            fi
        done < <(find "$full_path" -type f -print0 2>/dev/null || true)
    done
    
    # Clean by pattern across workspace
    for pattern in "${temp_patterns[@]}"; do
        while IFS= read -r -d '' file; do
            # Skip if file is in excluded directories
            if [[ "$file" == */.git/* ]] || [[ "$file" == */node_modules/* ]]; then
                continue
            fi
            
            local file_size_mb=$(get_size_mb "$file")
            
            if [ "$VERBOSE" = true ]; then
                info "Removing temp file by pattern: $(basename "$file")"
            fi
            
            if [ "$DRY_RUN" != true ]; then
                rm -f "$file"
            fi
            
            total_cleaned=$((total_cleaned + 1))
            total_size_freed=$((total_size_freed + file_size_mb))
        done < <(find "$WORKSPACE_ROOT" -name "$pattern" -type f -print0 2>/dev/null || true)
    done
    
    # Remove empty directories
    if [ "$DRY_RUN" != true ]; then
        for temp_dir in "${temp_locations[@]}"; do
            local full_path="$WORKSPACE_ROOT/$temp_dir"
            if [ -d "$full_path" ]; then
                find "$full_path" -type d -empty -delete 2>/dev/null || true
            fi
        done
    fi
    
    if [ $total_cleaned -gt 0 ]; then
        success "Temporary file cleanup completed: $total_cleaned files removed, ${total_size_freed}MB freed"
    else
        info "No temporary files needed cleaning"
    fi
}

# Optimize artifacts
optimize_artifacts() {
    if [ "$OPTIMIZE_ARTIFACTS" != true ]; then
        return 0
    fi
    
    info "Optimizing artifacts..."
    
    local artifacts_dir="$WORKSPACE_ROOT/artifacts"
    
    if [ ! -d "$artifacts_dir" ]; then
        info "No artifacts directory found, skipping optimization"
        return 0
    fi
    
    local duplicates_removed=0
    local empty_dirs_removed=0
    local size_optimized=0
    
    # Remove duplicate files
    info "Checking for duplicate artifacts..."
    
    declare -A file_hashes
    while IFS= read -r -d '' file; do
        if [ -f "$file" ]; then
            local hash=$(md5sum "$file" 2>/dev/null | cut -d' ' -f1 || echo "")
            if [ -n "$hash" ]; then
                if [ -n "${file_hashes[$hash]:-}" ]; then
                    # Duplicate found
                    local original="${file_hashes[$hash]}"
                    local file_size_mb=$(get_size_mb "$file")
                    
                    if [ "$VERBOSE" = true ]; then
                        info "Removing duplicate: $(basename "$file") (duplicate of $(basename "$original"))"
                    fi
                    
                    if [ "$DRY_RUN" != true ]; then
                        rm -f "$file"
                    fi
                    
                    duplicates_removed=$((duplicates_removed + 1))
                    size_optimized=$((size_optimized + file_size_mb))
                else
                    file_hashes[$hash]="$file"
                fi
            fi
        fi
    done < <(find "$artifacts_dir" -type f -print0 2>/dev/null || true)
    
    # Remove empty directories
    if [ "$DRY_RUN" != true ]; then
        while IFS= read -r -d '' dir; do
            if [ -d "$dir" ] && [ -z "$(ls -A "$dir" 2>/dev/null)" ]; then
                rmdir "$dir" 2>/dev/null || true
                empty_dirs_removed=$((empty_dirs_removed + 1))
            fi
        done < <(find "$artifacts_dir" -type d -print0 2>/dev/null || true)
    else
        empty_dirs_removed=$(find "$artifacts_dir" -type d -empty 2>/dev/null | wc -l)
    fi
    
    # Compress large artifacts (aggressive mode)
    if [ "$AGGRESSIVE" = true ]; then
        info "Compressing large artifacts..."
        
        while IFS= read -r -d '' file; do
            local file_size_mb=$(get_size_mb "$file")
            
            if [ "$file_size_mb" -gt 50 ] && [[ "$file" != *.gz ]] && [[ "$file" != *.zip ]]; then
                if [ "$VERBOSE" = true ]; then
                    info "Compressing large artifact: $(basename "$file") (${file_size_mb}MB)"
                fi
                
                if [ "$DRY_RUN" != true ]; then
                    gzip "$file"
                fi
                
                size_optimized=$((size_optimized + file_size_mb / 3)) # Estimate compression savings
            fi
        done < <(find "$artifacts_dir" -type f -print0 2>/dev/null || true)
    fi
    
    if [ $duplicates_removed -gt 0 ] || [ $empty_dirs_removed -gt 0 ]; then
        success "Artifact optimization completed: $duplicates_removed duplicates removed, $empty_dirs_removed empty directories removed, ${size_optimized}MB saved"
    else
        info "No artifact optimization needed"
    fi
}

# Clean old backups
clean_backups() {
    if [ "$CLEAN_BACKUPS" != true ]; then
        return 0
    fi
    
    info "Cleaning old backups..."
    
    local backup_dir="$WORKSPACE_ROOT/data/backups"
    
    if [ ! -d "$backup_dir" ]; then
        info "No backup directory found, skipping backup cleanup"
        return 0
    fi
    
    local backups_cleaned=0
    local total_size_freed=0
    local current_time=$(date +%s)
    local retention_time=$((current_time - BACKUP_RETENTION_DAYS * 24 * 3600))
    
    while IFS= read -r -d '' backup; do
        local backup_time=$(stat -f%m "$backup" 2>/dev/null || stat -c%Y "$backup" 2>/dev/null || echo "0")
        
        if [ "$backup_time" -lt "$retention_time" ]; then
            local backup_size_mb=$(get_size_mb "$backup")
            
            if [ "$VERBOSE" = true ]; then
                info "Removing old backup: $(basename "$backup") (${backup_size_mb}MB)"
            fi
            
            if [ "$DRY_RUN" != true ]; then
                rm -f "$backup"
            fi
            
            backups_cleaned=$((backups_cleaned + 1))
            total_size_freed=$((total_size_freed + backup_size_mb))
        fi
    done < <(find "$backup_dir" -name "*.tar*" -type f -print0 2>/dev/null || true)
    
    if [ $backups_cleaned -gt 0 ]; then
        success "Backup cleanup completed: $backups_cleaned old backups removed, ${total_size_freed}MB freed"
    else
        info "No old backups needed cleaning"
    fi
}

# Generate cleanup report
generate_report() {
    info "Generating cleanup report..."
    
    local report_file="$WORKSPACE_ROOT/logs/cleanup_report_${TIMESTAMP}.md"
    
    cat > "$report_file" << EOF
# Workspace Cleanup Report
**Date**: $(date -u +"%Y-%m-%d %H:%M:%S UTC")  
**Script Version**: 1.0.0  
**Cleanup Type**: $([ "$AGGRESSIVE" = true ] && echo "Aggressive" || echo "Standard")

## Cleanup Summary

### Configuration
- Dry Run: $([ "$DRY_RUN" = true ] && echo "Yes" || echo "No")
- Aggressive Mode: $([ "$AGGRESSIVE" = true ] && echo "Yes" || echo "No")
- Cache Retention: $CACHE_RETENTION_DAYS days
- Log Retention: $LOG_RETENTION_DAYS days
- Temp Retention: $TEMP_RETENTION_HOURS hours
- Max Log Size: ${MAX_LOG_SIZE_MB}MB

### Operations Performed
- Cache Cleanup: $([ "$CLEAN_CACHE" = true ] && echo "Yes" || echo "No")
- Log Cleanup: $([ "$CLEAN_LOGS" = true ] && echo "Yes" || echo "No")
- Temporary File Cleanup: $([ "$CLEAN_TEMP" = true ] && echo "Yes" || echo "No")
- Artifact Optimization: $([ "$OPTIMIZE_ARTIFACTS" = true ] && echo "Yes" || echo "No")
- Backup Cleanup: $([ "$CLEAN_BACKUPS" = true ] && echo "Yes" || echo "No")

### Results
- Total Files Processed: TBD
- Total Space Freed: TBD MB
- Errors Encountered: TBD
- Duration: TBD seconds

### Next Cleanup Recommendation
Based on current settings, next cleanup should be performed on: $(date -d "+7 days" +"%Y-%m-%d")

---
*Generated by Claude Code Workspace Cleanup Script*
EOF
    
    if [ "$VERBOSE" = true ]; then
        info "Cleanup report saved to: $report_file"
    fi
}

# Main cleanup orchestration
main() {
    local start_time=$(date +%s)
    
    # Create log directory
    mkdir -p "$(dirname "$LOG_FILE")"
    
    info "Claude Code Workspace Cleanup Script started"
    info "Workspace: $WORKSPACE_ROOT"
    info "Mode: $([ "$DRY_RUN" = true ] && echo "DRY RUN" || echo "LIVE")"
    info "Cleanup level: $([ "$AGGRESSIVE" = true ] && echo "AGGRESSIVE" || echo "STANDARD")"
    
    # Perform cleanup operations
    clean_cache
    clean_logs
    clean_temp
    optimize_artifacts
    clean_backups
    
    # Generate report
    generate_report
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    success "Workspace cleanup completed in ${duration} seconds"
    
    # Display final statistics
    local workspace_size_mb=$(get_dir_size_mb "$WORKSPACE_ROOT")
    info "Current workspace size: ${workspace_size_mb}MB"
    
    if [ "$DRY_RUN" = true ]; then
        warning "This was a dry run. No files were actually modified."
        info "Run without --dry-run to perform actual cleanup."
    fi
}

# Run main function
main "$@"