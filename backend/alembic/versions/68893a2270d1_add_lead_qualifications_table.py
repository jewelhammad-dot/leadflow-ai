"""add lead_qualifications table

Revision ID: 68893a2270d1
Revises:
Create Date: 2026-08-11

This is the first Alembic-tracked migration in this repo. The existing
users/leads tables predate Alembic and remain managed by the application's
startup create_all() for now. The qualification table is migration-tracked
from this revision onward.

The upgrade is intentionally idempotent for the current transition period:
app/main.py still calls Base.metadata.create_all(), which can create this
table before `alembic upgrade head` runs.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "68893a2270d1"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create the qualification history table and its indexes."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not inspector.has_table("lead_qualifications"):
        op.create_table(
            "lead_qualifications",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("lead_id", sa.Integer(), nullable=False),
            sa.Column("score", sa.Float(), nullable=False),
            sa.Column("classification", sa.String(), nullable=False),
            sa.Column("summary", sa.Text(), nullable=False),
            sa.Column("recommended_action", sa.Text(), nullable=False),
            sa.Column("ai_provider", sa.String(), nullable=False),
            sa.Column("ai_model", sa.String(), nullable=False),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("now()"),
                nullable=True,
            ),
            sa.ForeignKeyConstraint(["lead_id"], ["leads.id"]),
            sa.PrimaryKeyConstraint("id"),
        )

    existing_indexes = {index["name"] for index in sa.inspect(bind).get_indexes("lead_qualifications")}

    expected_indexes = {
        "ix_lead_qualifications_created_at": ["created_at"],
        "ix_lead_qualifications_id": ["id"],
        "ix_lead_qualifications_lead_id": ["lead_id"],
        "ix_lead_qualifications_lead_id_created_at": ["lead_id", "created_at"],
    }

    for name, columns in expected_indexes.items():
        if name not in existing_indexes:
            op.create_index(name, "lead_qualifications", columns, unique=False)


def downgrade() -> None:
    """Drop the qualification history table."""
    bind = op.get_bind()
    if sa.inspect(bind).has_table("lead_qualifications"):
        op.drop_table("lead_qualifications")
