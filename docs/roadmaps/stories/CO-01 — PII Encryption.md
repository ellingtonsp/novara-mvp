# CO-01 — PII Encryption

## Epic
**E4 Compliance Hardening** — Build trust through security and regulatory compliance

## Story
As a health-conscious user storing sensitive medical information, I want my personal health data encrypted at rest with enterprise-grade security, so I can trust Novara with my most private information.

## Acceptance Criteria
1. **Encryption Implementation**
   - [ ] All PII fields encrypted using AES-256-GCM
   - [ ] Encryption at column level for selective protection
   - [ ] Key derivation using PBKDF2 with 100,000+ iterations
   - [ ] Separate encryption keys per data category (health, identity, contact)

2. **Protected Data Fields**
   - [ ] User identity: name, email, date of birth
   - [ ] Health data: check-in responses, symptoms, medications
   - [ ] Contact info: phone, address (if collected)
   - [ ] Generated insights and health patterns
   - [ ] Appointment notes and provider information

3. **Key Management**
   - [ ] Master key stored in environment variable (never in code)
   - [ ] Key rotation mechanism implemented and documented
   - [ ] Backup key generation and secure storage process
   - [ ] Key versioning to support gradual migration

4. **Performance Requirements**
   - [ ] Encryption overhead < 50ms per operation
   - [ ] Batch operations for bulk data processing
   - [ ] Indexed fields remain searchable (blind indexing)
   - [ ] No noticeable impact on user experience

5. **Operational Tooling**
   - [ ] Script for initial data migration to encrypted format
   - [ ] Key rotation script with zero-downtime deployment
   - [ ] Audit log for all encryption operations
   - [ ] Monitoring alerts for encryption failures

## Technical Considerations
- Use PostgreSQL pgcrypto extension for native encryption
- Implement application-level encryption as fallback
- Consider field-level encryption vs full-database encryption
- Plan for encrypted backups and disaster recovery
- Ensure compatibility with existing queries and indexes

## Compliance Mapping
- **HIPAA**: Addresses encryption requirements for ePHI
- **GDPR**: Implements privacy by design principles
- **CCPA**: Enables secure data handling and deletion
- **SOC 2**: Meets Type II encryption controls

## Migration Plan
1. Deploy encryption code with feature flag (disabled)
2. Encrypt new records only (dual-write period)
3. Background job to encrypt existing records
4. Verify all data encrypted and accessible
5. Remove unencrypted data paths
6. Document completed in runbooks

## Business Value
- **Trust**: Users 3x more likely to share health data with encryption messaging
- **Compliance**: Unlocks enterprise customers requiring HIPAA compliance
- **Risk Mitigation**: Reduces breach impact and liability
- **Competitive**: Differentiator vs consumer health apps

## Dependencies
- PostgreSQL 12+ with pgcrypto extension
- Secure key management infrastructure
- Monitoring and alerting system
- Backup system supporting encrypted data

## Definition of Done
- [ ] All PII fields encrypted in production database
- [ ] Zero unencrypted PII in logs or debug output
- [ ] Key rotation successfully tested
- [ ] Performance benchmarks met
- [ ] Compliance audit checklist completed
- [ ] Runbook created for key rotation
- [ ] Security review passed
- [ ] Migration of existing data completed

## Story Points: 5
Complex implementation touching all data layers, requires careful planning and testing.