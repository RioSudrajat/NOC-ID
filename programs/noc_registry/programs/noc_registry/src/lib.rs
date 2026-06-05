use anchor_lang::prelude::*;

declare_id!("GpQrQR2pQnA7ihao7yJoCceas2x1nLor1nfB5QPPhHJU");

#[program]
pub mod noc_registry {
    use super::*;

    pub fn initialize_platform(
        ctx: Context<InitializePlatform>,
        platform_fee_bps: u16,
        gas_subsidy_bps: u16,
        max_batch_mint_size: u32,
    ) -> Result<()> {
        require!(platform_fee_bps <= 10_000, NocError::InvalidBasisPoints);
        require!(gas_subsidy_bps <= 10_000, NocError::InvalidBasisPoints);
        let config = &mut ctx.accounts.platform_config;
        config.superadmin = ctx.accounts.superadmin.key();
        config.platform_fee_bps = platform_fee_bps;
        config.gas_subsidy_bps = gas_subsidy_bps;
        config.max_batch_mint_size = max_batch_mint_size;
        config.paused = false;
        config.bump = ctx.bumps.platform_config;
        Ok(())
    }

    pub fn set_platform_config(
        ctx: Context<SetPlatformConfig>,
        platform_fee_bps: u16,
        gas_subsidy_bps: u16,
        max_batch_mint_size: u32,
        paused: bool,
    ) -> Result<()> {
        require!(platform_fee_bps <= 10_000, NocError::InvalidBasisPoints);
        require!(gas_subsidy_bps <= 10_000, NocError::InvalidBasisPoints);
        let config = &mut ctx.accounts.platform_config;
        config.platform_fee_bps = platform_fee_bps;
        config.gas_subsidy_bps = gas_subsidy_bps;
        config.max_batch_mint_size = max_batch_mint_size;
        config.paused = paused;
        Ok(())
    }

    pub fn register_enterprise(
        ctx: Context<RegisterEnterprise>,
        enterprise_id_hash: [u8; 32],
        metadata_hash: [u8; 32],
    ) -> Result<()> {
        require_not_paused(&ctx.accounts.platform_config)?;
        let enterprise = &mut ctx.accounts.enterprise_record;
        enterprise.enterprise_id_hash = enterprise_id_hash;
        enterprise.authority = ctx.accounts.enterprise_authority.key();
        enterprise.metadata_hash = metadata_hash;
        enterprise.active = true;
        enterprise.bump = ctx.bumps.enterprise_record;
        Ok(())
    }

    pub fn register_workshop(
        ctx: Context<RegisterWorkshop>,
        workshop_id_hash: [u8; 32],
        metadata_hash: [u8; 32],
    ) -> Result<()> {
        require_not_paused(&ctx.accounts.platform_config)?;
        let workshop = &mut ctx.accounts.workshop_record;
        workshop.workshop_id_hash = workshop_id_hash;
        workshop.authority = ctx.accounts.workshop_authority.key();
        workshop.metadata_hash = metadata_hash;
        workshop.status = WorkshopStatus::PendingKyc;
        workshop.bump = ctx.bumps.workshop_record;
        Ok(())
    }

    pub fn approve_workshop(ctx: Context<ApproveWorkshop>) -> Result<()> {
        require_not_paused(&ctx.accounts.platform_config)?;
        ctx.accounts.workshop_record.status = WorkshopStatus::Approved;
        Ok(())
    }

    pub fn grant_credential(
        ctx: Context<GrantCredential>,
        credential: CredentialKind,
        valid_until_unix: i64,
    ) -> Result<()> {
        require_not_paused(&ctx.accounts.platform_config)?;
        require!(
            ctx.accounts.workshop_record.status == WorkshopStatus::Approved,
            NocError::WorkshopNotApproved
        );
        let record = &mut ctx.accounts.credential_record;
        record.workshop = ctx.accounts.workshop_record.key();
        record.issuer = ctx.accounts.issuer.key();
        record.credential = credential;
        record.valid_until_unix = valid_until_unix;
        record.revoked = false;
        record.bump = ctx.bumps.credential_record;
        Ok(())
    }

    pub fn revoke_credential(ctx: Context<RevokeCredential>) -> Result<()> {
        require_not_paused(&ctx.accounts.platform_config)?;
        ctx.accounts.credential_record.revoked = true;
        Ok(())
    }

    pub fn register_vehicle_record(
        ctx: Context<RegisterVehicleRecord>,
        vin_hash: [u8; 32],
        metadata_hash: [u8; 32],
        cnft_asset: Pubkey,
        merkle_tree: Pubkey,
        leaf_index: u32,
    ) -> Result<()> {
        require_not_paused(&ctx.accounts.platform_config)?;
        require!(
            ctx.accounts.enterprise_record.authority == ctx.accounts.enterprise_authority.key(),
            NocError::Unauthorized
        );
        let vehicle = &mut ctx.accounts.vehicle_record;
        vehicle.vin_hash = vin_hash;
        vehicle.enterprise = ctx.accounts.enterprise_record.key();
        vehicle.current_owner = ctx.accounts.initial_owner.key();
        vehicle.metadata_hash = metadata_hash;
        vehicle.cnft_asset = cnft_asset;
        vehicle.merkle_tree = merkle_tree;
        vehicle.leaf_index = leaf_index;
        vehicle.status = VehicleStatus::Escrow;
        vehicle.bump = ctx.bumps.vehicle_record;
        Ok(())
    }

    pub fn mark_vehicle_transferred(ctx: Context<MarkVehicleTransferred>, new_owner: Pubkey) -> Result<()> {
        require_not_paused(&ctx.accounts.platform_config)?;
        require!(
            ctx.accounts.enterprise_record.authority == ctx.accounts.enterprise_authority.key(),
            NocError::Unauthorized
        );
        require!(
            ctx.accounts.vehicle_record.enterprise == ctx.accounts.enterprise_record.key(),
            NocError::Unauthorized
        );
        let vehicle = &mut ctx.accounts.vehicle_record;
        vehicle.current_owner = new_owner;
        vehicle.status = VehicleStatus::Transferred;
        Ok(())
    }

    pub fn claim_vehicle(ctx: Context<ClaimVehicle>) -> Result<()> {
        require_not_paused(&ctx.accounts.platform_config)?;
        let vehicle = &mut ctx.accounts.vehicle_record;
        require!(vehicle.current_owner == ctx.accounts.owner.key(), NocError::InvalidOwner);
        vehicle.status = VehicleStatus::Minted;
        Ok(())
    }

    pub fn anchor_service_log(
        ctx: Context<AnchorServiceLog>,
        service_id_hash: [u8; 32],
        odometer_km: u32,
        invoice_hash: [u8; 32],
        parts_hash: [u8; 32],
        evidence_hash: [u8; 32],
    ) -> Result<()> {
        require_not_paused(&ctx.accounts.platform_config)?;
        require!(
            ctx.accounts.workshop_record.authority == ctx.accounts.workshop_authority.key(),
            NocError::Unauthorized
        );
        require!(
            ctx.accounts.credential_record.workshop == ctx.accounts.workshop_record.key(),
            NocError::InvalidCredential
        );
        require_active_credential(&ctx.accounts.credential_record, CredentialKind::VerifiedSigner)?;
        let log = &mut ctx.accounts.service_log_record;
        log.vehicle = ctx.accounts.vehicle_record.key();
        log.workshop = ctx.accounts.workshop_record.key();
        log.service_id_hash = service_id_hash;
        log.odometer_km = odometer_km;
        log.invoice_hash = invoice_hash;
        log.parts_hash = parts_hash;
        log.evidence_hash = evidence_hash;
        log.created_at_unix = Clock::get()?.unix_timestamp;
        log.bump = ctx.bumps.service_log_record;
        Ok(())
    }

    pub fn verify_component_origin(
        ctx: Context<VerifyComponentOrigin>,
        service_id_hash: [u8; 32],
        invoice_hash: [u8; 32],
        parts_hash: [u8; 32],
        catalog_hash: [u8; 32],
        verified_part_count: u16,
    ) -> Result<()> {
        require_not_paused(&ctx.accounts.platform_config)?;
        require!(
            ctx.accounts.workshop_record.authority == ctx.accounts.workshop_authority.key(),
            NocError::Unauthorized
        );
        require!(
            ctx.accounts.credential_record.workshop == ctx.accounts.workshop_record.key(),
            NocError::InvalidCredential
        );
        require_active_credential(&ctx.accounts.credential_record, CredentialKind::OemCertified)?;

        let record = &mut ctx.accounts.component_origin_record;
        record.vehicle = ctx.accounts.vehicle_record.key();
        record.workshop = ctx.accounts.workshop_record.key();
        record.service_id_hash = service_id_hash;
        record.invoice_hash = invoice_hash;
        record.parts_hash = parts_hash;
        record.catalog_hash = catalog_hash;
        record.verified_part_count = verified_part_count;
        record.created_at_unix = Clock::get()?.unix_timestamp;
        record.bump = ctx.bumps.component_origin_record;
        Ok(())
    }

    pub fn anchor_trip_summary(
        ctx: Context<AnchorTripSummary>,
        trip_id_hash: [u8; 32],
        metrics_hash: [u8; 32],
    ) -> Result<()> {
        require_not_paused(&ctx.accounts.platform_config)?;
        require!(
            ctx.accounts.vehicle_record.current_owner == ctx.accounts.owner.key(),
            NocError::InvalidOwner
        );
        let trip = &mut ctx.accounts.trip_summary_record;
        trip.vehicle = ctx.accounts.vehicle_record.key();
        trip.owner = ctx.accounts.owner.key();
        trip.trip_id_hash = trip_id_hash;
        trip.metrics_hash = metrics_hash;
        trip.created_at_unix = Clock::get()?.unix_timestamp;
        trip.bump = ctx.bumps.trip_summary_record;
        Ok(())
    }

    pub fn anchor_case_event(
        ctx: Context<AnchorCaseEvent>,
        case_id_hash: [u8; 32],
        case_kind: CaseKind,
        payload_hash: [u8; 32],
        status_code: u8,
    ) -> Result<()> {
        require_not_paused(&ctx.accounts.platform_config)?;
        let case_record = &mut ctx.accounts.case_record;
        case_record.vehicle = ctx.accounts.vehicle_record.key();
        case_record.actor = ctx.accounts.actor.key();
        case_record.case_id_hash = case_id_hash;
        case_record.case_kind = case_kind;
        case_record.payload_hash = payload_hash;
        case_record.status_code = status_code;
        case_record.created_at_unix = Clock::get()?.unix_timestamp;
        case_record.bump = ctx.bumps.case_record;
        Ok(())
    }

    pub fn record_payment_receipt(
        ctx: Context<RecordPaymentReceipt>,
        payment_id_hash: [u8; 32],
        invoice_hash: [u8; 32],
        mint: Pubkey,
        amount_atomic: u64,
    ) -> Result<()> {
        require_not_paused(&ctx.accounts.platform_config)?;
        let receipt = &mut ctx.accounts.payment_receipt_record;
        receipt.vehicle = ctx.accounts.vehicle_record.key();
        receipt.payer = ctx.accounts.payment_payer.key();
        receipt.recipient = ctx.accounts.recipient.key();
        receipt.payment_id_hash = payment_id_hash;
        receipt.invoice_hash = invoice_hash;
        receipt.mint = mint;
        receipt.amount_atomic = amount_atomic;
        receipt.created_at_unix = Clock::get()?.unix_timestamp;
        receipt.bump = ctx.bumps.payment_receipt_record;
        Ok(())
    }
}

fn require_not_paused(config: &Account<PlatformConfig>) -> Result<()> {
    require!(!config.paused, NocError::PlatformPaused);
    Ok(())
}

fn require_active_credential(record: &Account<CredentialRecord>, expected: CredentialKind) -> Result<()> {
    require!(!record.revoked, NocError::CredentialRevoked);
    require!(record.credential == expected, NocError::InvalidCredential);
    let now = Clock::get()?.unix_timestamp;
    require!(record.valid_until_unix == 0 || record.valid_until_unix > now, NocError::CredentialExpired);
    Ok(())
}

#[derive(Accounts)]
pub struct InitializePlatform<'info> {
    #[account(mut)]
    pub superadmin: Signer<'info>,
    #[account(init, payer = superadmin, space = 8 + PlatformConfig::INIT_SPACE, seeds = [b"platform"], bump)]
    pub platform_config: Account<'info, PlatformConfig>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SetPlatformConfig<'info> {
    pub superadmin: Signer<'info>,
    #[account(mut, seeds = [b"platform"], bump = platform_config.bump, has_one = superadmin @ NocError::Unauthorized)]
    pub platform_config: Account<'info, PlatformConfig>,
}

#[derive(Accounts)]
#[instruction(enterprise_id_hash: [u8; 32])]
pub struct RegisterEnterprise<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub superadmin: Signer<'info>,
    #[account(seeds = [b"platform"], bump = platform_config.bump, has_one = superadmin @ NocError::Unauthorized)]
    pub platform_config: Account<'info, PlatformConfig>,
    /// CHECK: Stored as enterprise authority; signature is not required during admin onboarding.
    pub enterprise_authority: UncheckedAccount<'info>,
    #[account(init, payer = payer, space = 8 + EnterpriseRecord::INIT_SPACE, seeds = [b"enterprise", enterprise_id_hash.as_ref()], bump)]
    pub enterprise_record: Account<'info, EnterpriseRecord>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(workshop_id_hash: [u8; 32])]
pub struct RegisterWorkshop<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub superadmin: Signer<'info>,
    #[account(seeds = [b"platform"], bump = platform_config.bump, has_one = superadmin @ NocError::Unauthorized)]
    pub platform_config: Account<'info, PlatformConfig>,
    /// CHECK: Stored as workshop authority; KYC approval grants operational access later.
    pub workshop_authority: UncheckedAccount<'info>,
    #[account(init, payer = payer, space = 8 + WorkshopRecord::INIT_SPACE, seeds = [b"workshop", workshop_id_hash.as_ref()], bump)]
    pub workshop_record: Account<'info, WorkshopRecord>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ApproveWorkshop<'info> {
    pub superadmin: Signer<'info>,
    #[account(seeds = [b"platform"], bump = platform_config.bump, has_one = superadmin @ NocError::Unauthorized)]
    pub platform_config: Account<'info, PlatformConfig>,
    #[account(mut)]
    pub workshop_record: Account<'info, WorkshopRecord>,
}

#[derive(Accounts)]
#[instruction(credential: CredentialKind)]
pub struct GrantCredential<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub issuer: Signer<'info>,
    #[account(seeds = [b"platform"], bump = platform_config.bump)]
    pub platform_config: Account<'info, PlatformConfig>,
    #[account(mut)]
    pub workshop_record: Account<'info, WorkshopRecord>,
    #[account(init, payer = payer, space = 8 + CredentialRecord::INIT_SPACE, seeds = [b"credential", workshop_record.key().as_ref(), &[credential as u8]], bump)]
    pub credential_record: Account<'info, CredentialRecord>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RevokeCredential<'info> {
    pub issuer: Signer<'info>,
    #[account(seeds = [b"platform"], bump = platform_config.bump)]
    pub platform_config: Account<'info, PlatformConfig>,
    #[account(mut, has_one = issuer @ NocError::Unauthorized)]
    pub credential_record: Account<'info, CredentialRecord>,
}

#[derive(Accounts)]
#[instruction(vin_hash: [u8; 32])]
pub struct RegisterVehicleRecord<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub enterprise_authority: Signer<'info>,
    #[account(seeds = [b"platform"], bump = platform_config.bump)]
    pub platform_config: Account<'info, PlatformConfig>,
    #[account()]
    pub enterprise_record: Account<'info, EnterpriseRecord>,
    /// CHECK: Initial owner stored for claim/transfer flow.
    pub initial_owner: UncheckedAccount<'info>,
    #[account(init, payer = payer, space = 8 + VehicleRecord::INIT_SPACE, seeds = [b"vehicle", vin_hash.as_ref()], bump)]
    pub vehicle_record: Account<'info, VehicleRecord>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MarkVehicleTransferred<'info> {
    pub enterprise_authority: Signer<'info>,
    #[account(seeds = [b"platform"], bump = platform_config.bump)]
    pub platform_config: Account<'info, PlatformConfig>,
    pub enterprise_record: Account<'info, EnterpriseRecord>,
    #[account(mut)]
    pub vehicle_record: Account<'info, VehicleRecord>,
}

#[derive(Accounts)]
pub struct ClaimVehicle<'info> {
    pub owner: Signer<'info>,
    #[account(seeds = [b"platform"], bump = platform_config.bump)]
    pub platform_config: Account<'info, PlatformConfig>,
    #[account(mut)]
    pub vehicle_record: Account<'info, VehicleRecord>,
}

#[derive(Accounts)]
#[instruction(service_id_hash: [u8; 32])]
pub struct AnchorServiceLog<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub workshop_authority: Signer<'info>,
    #[account(seeds = [b"platform"], bump = platform_config.bump)]
    pub platform_config: Account<'info, PlatformConfig>,
    #[account(mut)]
    pub vehicle_record: Account<'info, VehicleRecord>,
    #[account()]
    pub workshop_record: Account<'info, WorkshopRecord>,
    #[account()]
    pub credential_record: Account<'info, CredentialRecord>,
    #[account(init, payer = payer, space = 8 + ServiceLogRecord::INIT_SPACE, seeds = [b"service-log", vehicle_record.key().as_ref(), service_id_hash.as_ref()], bump)]
    pub service_log_record: Account<'info, ServiceLogRecord>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(service_id_hash: [u8; 32])]
pub struct VerifyComponentOrigin<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub workshop_authority: Signer<'info>,
    #[account(seeds = [b"platform"], bump = platform_config.bump)]
    pub platform_config: Account<'info, PlatformConfig>,
    #[account()]
    pub vehicle_record: Account<'info, VehicleRecord>,
    #[account()]
    pub workshop_record: Account<'info, WorkshopRecord>,
    #[account()]
    pub credential_record: Account<'info, CredentialRecord>,
    #[account(init, payer = payer, space = 8 + ComponentOriginRecord::INIT_SPACE, seeds = [b"component-origin", vehicle_record.key().as_ref(), service_id_hash.as_ref()], bump)]
    pub component_origin_record: Account<'info, ComponentOriginRecord>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(trip_id_hash: [u8; 32])]
pub struct AnchorTripSummary<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub owner: Signer<'info>,
    #[account(seeds = [b"platform"], bump = platform_config.bump)]
    pub platform_config: Account<'info, PlatformConfig>,
    #[account()]
    pub vehicle_record: Account<'info, VehicleRecord>,
    #[account(init, payer = payer, space = 8 + TripSummaryRecord::INIT_SPACE, seeds = [b"trip", vehicle_record.key().as_ref(), trip_id_hash.as_ref()], bump)]
    pub trip_summary_record: Account<'info, TripSummaryRecord>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(case_id_hash: [u8; 32])]
pub struct AnchorCaseEvent<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub actor: Signer<'info>,
    #[account(seeds = [b"platform"], bump = platform_config.bump)]
    pub platform_config: Account<'info, PlatformConfig>,
    pub vehicle_record: Account<'info, VehicleRecord>,
    #[account(init, payer = payer, space = 8 + CaseRecord::INIT_SPACE, seeds = [b"case", vehicle_record.key().as_ref(), case_id_hash.as_ref()], bump)]
    pub case_record: Account<'info, CaseRecord>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(payment_id_hash: [u8; 32])]
pub struct RecordPaymentReceipt<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: Stored payment payer.
    pub payment_payer: UncheckedAccount<'info>,
    /// CHECK: Stored payment recipient.
    pub recipient: UncheckedAccount<'info>,
    #[account(seeds = [b"platform"], bump = platform_config.bump)]
    pub platform_config: Account<'info, PlatformConfig>,
    pub vehicle_record: Account<'info, VehicleRecord>,
    #[account(init, payer = payer, space = 8 + PaymentReceiptRecord::INIT_SPACE, seeds = [b"payment", vehicle_record.key().as_ref(), payment_id_hash.as_ref()], bump)]
    pub payment_receipt_record: Account<'info, PaymentReceiptRecord>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct PlatformConfig {
    pub superadmin: Pubkey,
    pub platform_fee_bps: u16,
    pub gas_subsidy_bps: u16,
    pub max_batch_mint_size: u32,
    pub paused: bool,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct EnterpriseRecord {
    pub enterprise_id_hash: [u8; 32],
    pub authority: Pubkey,
    pub metadata_hash: [u8; 32],
    pub active: bool,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct WorkshopRecord {
    pub workshop_id_hash: [u8; 32],
    pub authority: Pubkey,
    pub metadata_hash: [u8; 32],
    pub status: WorkshopStatus,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct CredentialRecord {
    pub workshop: Pubkey,
    pub issuer: Pubkey,
    pub credential: CredentialKind,
    pub valid_until_unix: i64,
    pub revoked: bool,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct VehicleRecord {
    pub vin_hash: [u8; 32],
    pub enterprise: Pubkey,
    pub current_owner: Pubkey,
    pub metadata_hash: [u8; 32],
    pub cnft_asset: Pubkey,
    pub merkle_tree: Pubkey,
    pub leaf_index: u32,
    pub status: VehicleStatus,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct ServiceLogRecord {
    pub vehicle: Pubkey,
    pub workshop: Pubkey,
    pub service_id_hash: [u8; 32],
    pub odometer_km: u32,
    pub invoice_hash: [u8; 32],
    pub parts_hash: [u8; 32],
    pub evidence_hash: [u8; 32],
    pub created_at_unix: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct ComponentOriginRecord {
    pub vehicle: Pubkey,
    pub workshop: Pubkey,
    pub service_id_hash: [u8; 32],
    pub invoice_hash: [u8; 32],
    pub parts_hash: [u8; 32],
    pub catalog_hash: [u8; 32],
    pub verified_part_count: u16,
    pub created_at_unix: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct TripSummaryRecord {
    pub vehicle: Pubkey,
    pub owner: Pubkey,
    pub trip_id_hash: [u8; 32],
    pub metrics_hash: [u8; 32],
    pub created_at_unix: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct CaseRecord {
    pub vehicle: Pubkey,
    pub actor: Pubkey,
    pub case_id_hash: [u8; 32],
    pub case_kind: CaseKind,
    pub payload_hash: [u8; 32],
    pub status_code: u8,
    pub created_at_unix: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct PaymentReceiptRecord {
    pub vehicle: Pubkey,
    pub payer: Pubkey,
    pub recipient: Pubkey,
    pub payment_id_hash: [u8; 32],
    pub invoice_hash: [u8; 32],
    pub mint: Pubkey,
    pub amount_atomic: u64,
    pub created_at_unix: i64,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum WorkshopStatus {
    PendingKyc,
    Approved,
    Rejected,
    Suspended,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum CredentialKind {
    VerifiedSigner,
    OemCertified,
    ManufacturerAuditPartner,
    RecallExecutor,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum VehicleStatus {
    Pending,
    Escrow,
    Minted,
    Transferred,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum CaseKind {
    Warranty,
    Dispute,
    Recall,
}

#[error_code]
pub enum NocError {
    #[msg("Platform is paused.")]
    PlatformPaused,
    #[msg("The caller is not authorized for this operation.")]
    Unauthorized,
    #[msg("Basis points must be <= 10000.")]
    InvalidBasisPoints,
    #[msg("Workshop is not approved.")]
    WorkshopNotApproved,
    #[msg("Credential is revoked.")]
    CredentialRevoked,
    #[msg("Credential is expired.")]
    CredentialExpired,
    #[msg("Credential does not permit this action.")]
    InvalidCredential,
    #[msg("Owner does not match the vehicle record.")]
    InvalidOwner,
}
