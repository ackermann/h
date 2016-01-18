# -*- coding: utf-8 -*-

"""
Annotation domain model classes.

Classes to represent objects managed by the Annotations API.
"""

from __future__ import unicode_literals

import datetime

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql as pg

from h.api.db import Base
from h.api.db import types


class Timestamps(object):
    created = sa.Column(sa.DateTime,
                        default=datetime.datetime.utcnow,
                        server_default=sa.func.now(),
                        nullable=False)
    updated = sa.Column(sa.DateTime,
                        server_default=sa.func.now(),
                        default=datetime.datetime.utcnow,
                        onupdate=datetime.datetime.utcnow,
                        nullable=False)


class Annotation(Base, Timestamps):
    __tablename__ = 'annotation'
    __table_args__ = (
        sa.Index('ix_annotation_tags', 'tags', postgresql_using='gin'),
    )

    id = sa.Column(types.URLSafeUUID,
                   server_default=sa.func.uuid_generate_v1mc(),
                   primary_key=True)

    userid = sa.Column(sa.UnicodeText,
                       nullable=False,
                       index=True)
    groupid = sa.Column(sa.UnicodeText,
                        default='__world__',
                        server_default='__world__',
                        nullable=False,
                        index=True)

    text = sa.Column(sa.UnicodeText)
    tags = sa.Column(pg.ARRAY(sa.UnicodeText, zero_indexes=True),
                     index=True)

    shared = sa.Column(sa.Boolean,
                       nullable=False,
                       default=False,
                       server_default=sa.sql.expression.false())

    target_uri = sa.Column(sa.UnicodeText)
    target_uri_normalized = sa.Column(sa.UnicodeText)
    target_selectors = sa.Column(types.AnnotationSelectorJSONB,
                                 default=list,
                                 server_default=sa.func.jsonb('[]'))

    references = sa.Column(pg.ARRAY(types.URLSafeUUID),
                           default=list,
                           server_default=sa.text('ARRAY[]::uuid[]'))

    extra = sa.Column(pg.JSONB, nullable=True)

    def __repr__(self):
        return '<Annotation %s>' % self.id
