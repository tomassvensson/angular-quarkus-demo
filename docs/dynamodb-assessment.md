# DynamoDB Assessment

## Overview

This document assesses the current DynamoDB usage in the Angular Quarkus Demo application and provides recommendations for production readiness.

## Current Table Design

| Table | Partition Key | Sort Key | GSIs (Terraform) | GSIs Used in Code |
|-------|-------------|----------|-------------------|-------------------|
| **Links** | `id` (UUID) | None | None | None |
| **Lists** | `id` (UUID) | None | `OwnerIndex` (PK: `owner`) | **Not used** |
| **Comments** | `id` (UUID) | None | `EntityIndex` (PK: `entityId`) | **Not used** |
| **Votes** | `id` (UUID) | None | `EntityIndex` (PK: `entityId`) | **Not used** |
| **Notifications** | `id` (UUID) | None | `UserIndex` (PK: `userId`) | **Not used** |
| **AuditLogs** | `id` (UUID) | None | `EntityIndex`, `UserIndex` | **Not used** |

**Critical finding:** Terraform defines 7 GSIs across 5 tables, but the Java code uses **none of them**. Every query is a full table `scan()` with client-side filtering.

## Access Pattern Analysis

### Full Table Scans (9 scan methods)

| Service | Method | Multiplied |
|---------|--------|------------|
| LinkService | `getListsByOwner()`, `getPublishedLists()` | Frequent page loads |
| CommentService | `getCommentsForEntity()` | 2-3× per comment operation |
| VoteService | `getVotesForEntity()`, `findVote()` | 2× per vote operation |
| NotificationService | `getUserNotifications()` | Per page load + polling |
| AuditService | `getRecentLogs()`, `getLogsForEntity()`, `getLogsForUser()` | Admin dashboard |

### Performance Impact Estimate (10,000 items/table)

| Approach | RCUs/minute | Cost |
|----------|-------------|------|
| Current (scan-based) | ~450,000 | High |
| With GSI queries | ~50 | **9,000× cheaper** |

## Recommendations (Priority Order)

### 1. Wire Up Existing GSIs in Java Code (Critical)
All 7 GSIs are paid for (writes replicate to GSIs) but never queried. Convert `scan()` calls to `query()` on the appropriate GSI.

### 2. Add Sort Keys to GSIs
Current GSIs lack sort keys, preventing ordered queries. Add:
- `OwnerIndex`: sort by `createdAt`
- `EntityIndex` (Comments): sort by `createdAt`  
- `UserIndex` (Notifications): sort by `createdAt`
- `EntityIndex`/`UserIndex` (AuditLogs): sort by `timestamp`

### 3. Replace N+1 Queries with BatchGetItem
`getLinksByIds()` does N individual `getItem()` calls. Use `BatchGetItem` (max 100 items per batch).

### 4. Add TTL to Notifications and AuditLogs
These tables grow unboundedly. Configure DynamoDB TTL on a `ttl` attribute to auto-expire old records.

### 5. Add PublishedIndex GSI to Lists Table
`getPublishedLists()` is the most frequently called scan. Add a sparse GSI where only published lists are projected.

### 6. Redesign Votes Table Key Schema
Current design requires scanning to find a user's vote. Redesign:
- PK: `entityType#entityId`
- SK: `userId`

This makes `findVote()` a direct `getItem` instead of a full scan.

### 7. Use DynamoDB-Level Pagination
Replace client-side pagination (load all → slice) with `lastEvaluatedKey`-based pagination using DynamoDB Query `limit` parameter.

## Is DynamoDB the Right Choice?

### Good Fit For:
- **Notifications** — write-heavy, user-partitioned, time-ordered
- **Audit Logs** — append-only, time-series data
- **Votes** — simple key-value with proper composite keys

### Better Served By PostgreSQL:
- **Lists + Links** — relational data with ad-hoc queries and aggregations
- **Comments** — tree structures, nested replies, participant queries

### Recommended Hybrid Approach
For production: PostgreSQL (Aurora Serverless) for core domain data + DynamoDB for notifications and audit logs. However, DynamoDB can work for all tables if the schema is properly redesigned with GSIs and composite keys.

## Scalability Concerns

| Concern | Severity | Mitigation |
|---------|----------|------------|
| Every read is a full table scan | **CRITICAL** | Use GSI queries |
| No DynamoDB-level pagination | **HIGH** | Use `lastEvaluatedKey` |
| Client-side sorting | **HIGH** | Use sort keys on GSIs |
| N+1 queries in getLinksByIds | **MEDIUM** | Use BatchGetItem |
| No TTL on Notifications/AuditLogs | **MEDIUM** | Configure DynamoDB TTL |
| Duplicate scans per operation | **MEDIUM** | Cache within request scope |
| GSIs defined but unused | **WASTE** | Wire up in Java code |
