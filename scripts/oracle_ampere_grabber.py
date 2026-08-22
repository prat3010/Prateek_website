#!/usr/bin/env python3
"""
Oracle Cloud Infrastructure (OCI) Ampere A1 Compute Instance Auto-Provisioner & Notifier

Continuously scans OCI for host capacity availability for VM.Standard.A1.Flex (Ampere ARM)
instances and launches the instance as soon as capacity frees up. Once launched successfully,
it sends a notification via Telegram, Discord, or Email (Resend) and stops.

Usage:
  python3 scripts/oracle_ampere_grabber.py [--config .env.oci] [--dry-run] [--once] [--interval 60]
"""

import os
import sys
import time
import json
import argparse
import logging
import urllib.request
import urllib.parse
from datetime import datetime

# Setup Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("oracle_grabber.log", encoding="utf-8")
    ]
)
logger = logging.getLogger("OCI_Ampere_Grabber")


def load_env_file(filepath: str):
    """Simple parser for .env / config files without requiring external packages."""
    if not os.path.exists(filepath):
        return
    with open(filepath, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, val = line.split("=", 1)
            key = key.strip()
            val = val.strip().strip("'\"")
            if key and not os.environ.get(key):
                os.environ[key] = val


def send_telegram_notification(token: str, chat_id: str, message: str) -> bool:
    """Send alert via Telegram Bot API."""
    if not token or not chat_id:
        return False
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = json.dumps({"chat_id": chat_id, "text": message, "parse_mode": "Markdown"}).encode("utf-8")
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status == 200
    except Exception as e:
        logger.error(f"Telegram notification failed: {e}")
        return False


def send_discord_notification(webhook_url: str, title: str, description: str) -> bool:
    """Send alert via Discord Webhook."""
    if not webhook_url:
        return False
    embed = {
        "title": title,
        "description": description,
        "color": 3066993,  # Green
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
    payload = json.dumps({"embeds": [embed]}).encode("utf-8")
    req = urllib.request.Request(webhook_url, data=payload, headers={"Content-Type": "application/json", "User-Agent": "OCI-Grabber"})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status in (200, 204)
    except Exception as e:
        logger.error(f"Discord notification failed: {e}")
        return False


def send_resend_email(api_key: str, to_email: str, subject: str, body: str) -> bool:
    """Send alert email via Resend API."""
    if not api_key or not to_email:
        return False
    url = "https://api.resend.com/emails"
    payload = json.dumps({
        "from": "Oracle Grabber <onboarding@resend.dev>",
        "to": [to_email],
        "subject": subject,
        "text": body
    }).encode("utf-8")
    req = urllib.request.Request(url, data=payload, headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    })
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status in (200, 201)
    except Exception as e:
        logger.error(f"Resend Email notification failed: {e}")
        return False


def notify_all(subject: str, message: str):
    """Trigger all configured notification channels."""
    logger.info(f"📢 NOTIFICATION TRIGGERED: {subject}")
    
    # Telegram
    tg_token = os.environ.get("TELEGRAM_BOT_TOKEN")
    tg_chat = os.environ.get("TELEGRAM_CHAT_ID")
    if tg_token and tg_chat:
        if send_telegram_notification(tg_token, tg_chat, f"🎉 *{subject}*\n\n{message}"):
            logger.info("✅ Telegram alert sent.")
            
    # Discord
    discord_url = os.environ.get("DISCORD_WEBHOOK_URL")
    if discord_url:
        if send_discord_notification(discord_url, subject, message):
            logger.info("✅ Discord alert sent.")
            
    # Resend Email
    resend_key = os.environ.get("RESEND_API_KEY")
    email_to = os.environ.get("NOTIFICATION_EMAIL_TO") or os.environ.get("CONTACT_EMAIL_TO")
    if resend_key and email_to:
        if send_resend_email(resend_key, email_to, f"[OCI Grabber] {subject}", message):
            logger.info("✅ Email alert sent via Resend.")


def launch_ampere_instance(oci, compute_client, config_dict, dry_run=False):
    """
    Attempts to launch the Ampere instance using OCI SDK.
    Returns (success: bool, result_message: str, is_capacity_error: bool)
    """
    compartment_id = os.environ.get("OCI_COMPARTMENT_OCID") or config_dict.get("tenancy")
    availability_domain = os.environ.get("OCI_AVAILABILITY_DOMAIN")
    subnet_id = os.environ.get("OCI_SUBNET_OCID")
    image_id = os.environ.get("OCI_IMAGE_OCID")
    ssh_key = os.environ.get("OCI_SSH_PUBLIC_KEY")
    
    display_name = os.environ.get("OCI_INSTANCE_DISPLAY_NAME", "Ampere-A1-AlwaysFree")
    shape = os.environ.get("OCI_SHAPE", "VM.Standard.A1.Flex")
    ocpus = float(os.environ.get("OCI_OCPUS", "2"))
    memory_in_gbs = float(os.environ.get("OCI_MEMORY_IN_GBS", "12"))
    boot_volume_gb = int(os.environ.get("OCI_BOOT_VOLUME_GB", "50"))

    # Missing mandatory configs check
    missing = []
    if not compartment_id: missing.append("OCI_COMPARTMENT_OCID / tenancy")
    if not availability_domain: missing.append("OCI_AVAILABILITY_DOMAIN")
    if not subnet_id: missing.append("OCI_SUBNET_OCID")
    if not image_id: missing.append("OCI_IMAGE_OCID")
    if not ssh_key: missing.append("OCI_SSH_PUBLIC_KEY")
    
    if missing:
        err_msg = f"Missing required OCI parameters: {', '.join(missing)}"
        logger.error(err_msg)
        return False, err_msg, False

    if dry_run:
        msg = f"[DRY RUN SUCCESS] Validated parameters for shape {shape} ({ocpus} OCPU, {memory_in_gbs}GB RAM) in AD {availability_domain}."
        logger.info(msg)
        return True, msg, False

    # Construct LaunchInstanceDetails
    launch_details = oci.core.models.LaunchInstanceDetails(
        compartment_id=compartment_id,
        availability_domain=availability_domain,
        display_name=display_name,
        shape=shape,
        shape_config=oci.core.models.LaunchInstanceShapeConfigDetails(
            ocpus=ocpus,
            memory_in_gbs=memory_in_gbs
        ),
        source_details=oci.core.models.InstanceSourceViaImageDetails(
            source_type="image",
            image_id=image_id,
            boot_volume_size_in_gbs=boot_volume_gb
        ),
        create_vnic_details=oci.core.models.CreateVnicDetails(
            subnet_id=subnet_id,
            assign_public_ip=True
        ),
        metadata={
            "ssh_authorized_keys": ssh_key
        }
    )

    try:
        logger.info(f"Attempting launch_instance for {shape} ({ocpus} OCPUs, {memory_in_gbs}GB RAM)...")
        response = compute_client.launch_instance(launch_instance_details=launch_details)
        instance = response.data
        success_msg = f"🚀 INSTANCE CREATED SUCCESSFULLY!\nInstance ID: {instance.id}\nDisplay Name: {instance.display_name}\nLifecycle State: {instance.lifecycle_state}\nAD: {instance.availability_domain}"
        return True, success_msg, False

    except oci.exceptions.ServiceError as e:
        status_code = e.status
        code = e.code or ""
        msg = e.message or str(e)

        # Out of host capacity / Rate limit errors
        if status_code in (500, 429, 503) or "OutOfCapacity" in code or "Out of host capacity" in msg or "LimitExceeded" in code:
            logger.warning(f"Capacity unavailable [{status_code} - {code}]: {msg}")
            return False, f"Out of capacity ({code})", True
        else:
            logger.error(f"OCI API Error [{status_code} - {code}]: {msg}")
            return False, f"OCI API Error [{status_code} - {code}]: {msg}", False

    except Exception as e:
        logger.error(f"Unexpected error during launch: {e}")
        return False, f"Unexpected error: {str(e)}", False


def main():
    parser = argparse.ArgumentParser(description="Oracle Cloud Ampere Instance Auto-Provisioner")
    parser.add_argument("--config", default=".env.oci", help="Path to env config file (default: .env.oci)")
    parser.add_argument("--dry-run", action="store_true", help="Validate credentials and test notification without launching")
    parser.add_argument("--once", action="store_true", help="Run scan once and exit")
    parser.add_argument("--interval", type=int, default=60, help="Interval in seconds between retries (default: 60)")
    args = parser.parse_args()

    # Load environment variables
    load_env_file(args.config)
    load_env_file(".env.local")
    load_env_file(".env")

    # Import OCI SDK
    try:
        import oci
    except ImportError:
        logger.error("The 'oci' Python package is not installed.")
        logger.error("Please install it via: pip install oci python-dotenv")
        sys.exit(1)

    # Initialize OCI Config & Client
    key_file = os.environ.get("OCI_KEY_FILE")
    tenancy = os.environ.get("OCI_TENANCY_OCID")
    user = os.environ.get("OCI_USER_OCID")
    fingerprint = os.environ.get("OCI_FINGERPRINT")
    region = os.environ.get("OCI_REGION", "us-ashburn-1")

    # Build config dictionary
    if key_file and tenancy and user and fingerprint:
        oci_config = {
            "user": user,
            "key_file": key_file,
            "fingerprint": fingerprint,
            "tenancy": tenancy,
            "region": region
        }
    else:
        # Fallback to standard ~/.oci/config file
        config_path = os.path.expanduser("~/.oci/config")
        if os.path.exists(config_path):
            logger.info("Using standard ~/.oci/config profile")
            oci_config = oci.config.from_file(config_path, "DEFAULT")
        else:
            logger.error("OCI API credentials missing! Please configure .env.oci or ~/.oci/config")
            sys.exit(1)

    compute_client = oci.core.ComputeClient(oci_config)

    if args.dry_run:
        logger.info("--- STARTING DRY RUN ---")
        success, msg, _ = launch_ampere_instance(oci, compute_client, oci_config, dry_run=True)
        if success:
            notify_all("OCI Grabber Test Notification", "Dry run completed successfully. Notifications are working!")
        else:
            logger.error(f"Dry run failed: {msg}")
        return

    interval = int(os.environ.get("SCAN_INTERVAL_SECONDS", args.interval))
    logger.info(f"Starting OCI Ampere Capacity Scanner (Retry interval: {interval}s)...")

    attempts = 0
    while True:
        attempts += 1
        logger.info(f"Scan attempt #{attempts} at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        success, msg, is_capacity_error = launch_ampere_instance(oci, compute_client, oci_config, dry_run=False)

        if success:
            logger.info("🎉 SUCCESS! Instance launched.")
            notify_all("Oracle Ampere Instance Secured!", msg)
            break

        if not is_capacity_error:
            # Fatal or configuration error (e.g. invalid auth, invalid OCID)
            notify_all("OCI Grabber Halted - Configuration Error", f"Grabber stopped due to error: {msg}")
            logger.error("Stopping grabber due to non-capacity error.")
            sys.exit(1)

        if args.once:
            logger.info("Single scan complete. Out of capacity.")
            break

        logger.info(f"Waiting {interval} seconds before next attempt...")
        time.sleep(interval)


if __name__ == "__main__":
    main()
