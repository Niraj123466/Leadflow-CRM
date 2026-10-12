"""initial leads and discussions

Revision ID: 0001_initial
Revises:
Create Date: 2026-10-13 00:00:00

"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0001_initial"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

LEAD_STATUS = sa.Enum(
    "new",
    "contacted",
    "qualified",
    "proposal_sent",
    "won",
    "lost",
    name="lead_status",
    native_enum=False,
    length=32,
)


def upgrade() -> None:
    op.create_table(
        "leads",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("company", sa.String(length=200), nullable=True),
        sa.Column("phone", sa.String(length=50), nullable=True),
        sa.Column("status", LEAD_STATUS, nullable=False, server_default="new"),
        sa.Column("next_follow_up_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_leads_status", "leads", ["status"])
    op.create_index("ix_leads_next_follow_up_at", "leads", ["next_follow_up_at"])

    op.create_table(
        "discussions",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column(
            "lead_id",
            sa.Integer(),
            sa.ForeignKey("leads.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("note", sa.Text(), nullable=False),
        sa.Column("follow_up_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index(
        "ix_discussions_lead_id_created_at",
        "discussions",
        ["lead_id", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_discussions_lead_id_created_at", table_name="discussions")
    op.drop_table("discussions")
    op.drop_index("ix_leads_next_follow_up_at", table_name="leads")
    op.drop_index("ix_leads_status", table_name="leads")
    op.drop_table("leads")
