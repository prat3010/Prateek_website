#!/usr/bin/env python3
"""
Unit tests for sync_retriever.py adapter.
Verifies markdown case study formatting and HTTP request construction.
"""

import json
import unittest
from unittest.mock import patch, MagicMock
import sys
import os

# Add scripts directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sync_retriever import (
    format_project_case_study,
    ingest_document_to_tenant,
    sync_project_to_retriever,
    bulk_sync_all_projects_to_retriever,
)


class TestSyncRetriever(unittest.TestCase):

    def setUp(self):
        self.sample_project = {
            "id": "retriever-rag-engine",
            "title": "Retriever Cognitive Engine",
            "systemRole": "SYS-01 // COGNITIVE RETRIEVAL ENGINE",
            "category": "ai",
            "telemetryBadge": "LIVE ON ORACLE VPS",
            "tags": ["Python", "FastAPI", "pgvector", "Ollama"],
            "description": "High-throughput cognitive RAG and hybrid search microservice.",
            "longDescription": "Engineered with hexagonal architecture, strict PostgreSQL RLS multi-tenancy, and BM25 + HNSW fusion.",
            "liveUrl": "https://rag.prateeq.in",
            "githubUrl": "https://github.com/prat3010/retriever",
            "architectureHighlights": [
                "Hexagonal domain model isolation",
                "pgvector HNSW index with cosine distance",
            ],
            "challenges": [
                {
                    "challenge": "Preventing cross-tenant vector leakage.",
                    "solution": "Session-level PostgreSQL Row-Level Security variables.",
                }
            ],
            "keyDeliverables": [
                "FastAPI REST backend",
                "pgvector automated migrations",
            ],
        }

    def test_format_project_case_study(self):
        doc = format_project_case_study(self.sample_project)
        self.assertIn("# System Architecture Case Study: Retriever Cognitive Engine", doc)
        self.assertIn("SYS-01 // COGNITIVE RETRIEVAL ENGINE", doc)
        self.assertIn("LIVE ON ORACLE VPS", doc)
        self.assertIn("Python, FastAPI, pgvector, Ollama", doc)
        self.assertIn("Hexagonal domain model isolation", doc)
        self.assertIn("Preventing cross-tenant vector leakage.", doc)
        self.assertIn("https://rag.prateeq.in", doc)

    @patch("urllib.request.urlopen")
    def test_ingest_document_to_tenant_success(self, mock_urlopen):
        mock_resp = MagicMock()
        mock_resp.status = 201
        mock_resp.__enter__.return_value = mock_resp
        mock_urlopen.return_value = mock_resp

        ok = ingest_document_to_tenant(
            tenant_id="test-tenant-123",
            api_key="test-key-456",
            filename="case_study_test.md",
            content="# Test Content",
            tags=["portfolio", "ai"],
            api_url="https://mock.rag.local",
        )

        self.assertTrue(ok)
        self.assertEqual(mock_urlopen.call_count, 1)

        # Inspect the Request object passed
        req = mock_urlopen.call_args[0][0]
        self.assertEqual(req.full_url, "https://mock.rag.local/v1/tenants/test-tenant-123/documents/raw")
        self.assertEqual(req.headers.get("Authorization"), "Bearer test-key-456")
        self.assertEqual(req.headers.get("X-tenant-id"), "test-tenant-123")

        payload = json.loads(req.data.decode("utf-8"))
        self.assertEqual(payload["title"], "case_study_test.md")
        self.assertEqual(payload["content"], "# Test Content")
        self.assertEqual(payload["mime_type"], "text/markdown")
        self.assertEqual(payload["tags"], ["portfolio", "ai"])

    @patch("sync_retriever.ingest_document_to_tenant")
    def test_sync_project_to_retriever(self, mock_ingest):
        mock_ingest.return_value = True

        res = sync_project_to_retriever(self.sample_project)

        self.assertTrue(res["success"])
        self.assertTrue(res["scoping_ok"])
        self.assertTrue(res["portfolio_ok"])
        self.assertEqual(res["filename"], "case_study_retriever_rag_engine.md")
        self.assertFalse(res["is_delete"])
        # Ingests to both tenants
        self.assertEqual(mock_ingest.call_count, 2)

    @patch("sync_retriever.sync_project_to_retriever")
    def test_bulk_sync_all_projects_to_retriever(self, mock_sync):
        mock_sync.return_value = {
            "success": True,
            "scoping_ok": True,
            "portfolio_ok": True,
            "filename": "case_study_test.md",
        }

        res = bulk_sync_all_projects_to_retriever([self.sample_project, self.sample_project])

        self.assertEqual(res["total"], 2)
        self.assertEqual(res["scoping_synced"], 2)
        self.assertEqual(res["portfolio_synced"], 2)
        self.assertEqual(len(res["results"]), 2)


if __name__ == "__main__":
    unittest.main()
