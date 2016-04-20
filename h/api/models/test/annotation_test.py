# -*- coding: utf-8 -*-

from __future__ import unicode_literals

from pyramid import security
import pytest

from h import db
from h.api.models.annotation import Annotation
from h.api.models.document import Document, DocumentURI


class TestAnnotation(object):
    def test_document(self, annotation):
        document = Document(document_uris=[DocumentURI(claimant=annotation.target_uri,
                                                       uri=annotation.target_uri)])
        db.Session.add(document)
        db.Session.flush()

        assert annotation.document == document

    def test_document_not_found(self, annotation):
        document = Document(document_uris=[DocumentURI(claimant='something-else',
                                                       uri='something-else')])
        db.Session.add(document)
        db.Session.flush()

        assert annotation.document is None

    def test_parent_id(self):
        ann = Annotation(references=[5, 4, 3, 2])

        assert ann.parent_id == 2

    def test_parent_id_no_references(self):
        ann = Annotation(references=[])

        assert ann.parent_id is None

    def test_acl_private(self):
        ann = Annotation(shared=False, userid='saoirse')
        actual = ann.__acl__()
        expect = [(security.Allow, 'saoirse', 'read'),
                  (security.Allow, 'saoirse', 'admin'),
                  (security.Allow, 'saoirse', 'update'),
                  (security.Allow, 'saoirse', 'delete'),
                  security.DENY_ALL]
        assert actual == expect

    def test_acl_world_shared(self):
        ann = Annotation(shared=True, userid='saoirse', groupid='__world__')
        actual = ann.__acl__()
        expect = [(security.Allow, security.Everyone, 'read'),
                  (security.Allow, 'saoirse', 'admin'),
                  (security.Allow, 'saoirse', 'update'),
                  (security.Allow, 'saoirse', 'delete'),
                  security.DENY_ALL]
        assert actual == expect

    def test_acl_group_shared(self):
        ann = Annotation(shared=True, userid='saoirse', groupid='lulapalooza')
        actual = ann.__acl__()
        expect = [(security.Allow, 'group:lulapalooza', 'read'),
                  (security.Allow, 'saoirse', 'admin'),
                  (security.Allow, 'saoirse', 'update'),
                  (security.Allow, 'saoirse', 'delete'),
                  security.DENY_ALL]
        assert actual == expect

    @pytest.fixture
    def annotation(self):
        ann = Annotation(userid="testuser", target_uri="http://example.com")

        db.Session.add(ann)
        db.Session.flush()
        return ann
