# -*- coding: utf-8 -*-

from h.celery import celery

from h.api import presenters
from h.api.search.index import index
from h.api.search.index import delete

__all__ = ('index_annotation',)


@celery.task
def index_annotation(action, annotation):
    if action == 'create':
        index(celery.request.es, annotation, celery.request)
    elif action == 'delete':
        delete(celery.request.es, annotation)


def subscribe_annotation_event(event):
    if not event.request.feature('postgres'):
        return

    presented = presenters.AnnotationJSONPresenter(
        event.request, event.annotation).asdict()
    index_annotation.delay(event.action, presented)


def includeme(config):
    config.add_subscriber('h.annotation_sync.subscribe_annotation_event',
                          'h.api.events.AnnotationEvent')
