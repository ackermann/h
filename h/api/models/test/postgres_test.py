# -*- coding: utf-8 -*-

from h import db
from h.api.models.postgres import Document, DocumentURI


def test_document_get_or_create_by_uris():
    document = Document()
    docuri1 = DocumentURI(
        claimant=u'https://en.wikipedia.org/wiki/Main_Page',
        uri=u'https://en.wikipedia.org/wiki/Main_Page',
        document=document)
    docuri2 = DocumentURI(
        claimant=u'https://en.wikipedia.org/wiki/http/en.m.wikipedia.org/wiki/Main_Page',
        uri=u'https://en.wikipedia.org/wiki/Main_Page',
        document=document)

    db.Session.add(docuri1)
    db.Session.add(docuri2)
    db.Session.flush()

    actual = Document.get_or_create_by_uris(
        u'https://en.wikipedia.org/wiki/Main_Page',
        [u'https://en.wikipedia.org/wiki/http/en.m.wikipedia.org/wiki/Main_Page',
         u'https://m.en.wikipedia.org/wiki/Main_Page'])
    assert actual.id == document.id


def test_document_get_by_uris_no_results():
    document = Document()
    docuri = DocumentURI(
        claimant=u'https://en.wikipedia.org/wiki/Main_Page',
        uri=u'https://en.wikipedia.org/wiki/Main_Page',
        document=document)

    db.Session.add(docuri)
    db.Session.flush()

    actual = Document.get_or_create_by_uris(
        u'https://en.wikipedia.org/wiki/Pluto',
        [u'https://m.en.wikipedia.org/wiki/Pluto'])

    assert isinstance(actual, Document)
    assert actual.id is None
    assert len(actual.uris) == 1

    docuri = actual.uris[0]
    assert docuri.claimant == u'https://en.wikipedia.org/wiki/Pluto'
    assert docuri.uri == u'https://en.wikipedia.org/wiki/Pluto'
    assert docuri.type == 'self-claim'
