# -*- coding: utf-8 -*-

import mock
import pytest
from pyramid.testing import DummyRequest

from h.api import events
from h.api import models
from h import annotation_sync

@pytest.mark.usefixtures('celery', 'index', 'delete')
class TestIndexAnnotation(object):

    def test_it_calls_index_when_action_is_create(self, index, delete, celery):
        ann = {'id': '42'}
        annotation_sync.index_annotation('create', ann)

        index.assert_called_once_with(celery.request.es, ann, celery.request)
        assert not delete.called

    def test_it_calls_delete_when_action_is_delete(self, delete, index, celery):
        ann = {'id': '42'}
        annotation_sync.index_annotation('delete', ann)

        delete.assert_called_once_with(celery.request.es, ann)
        assert not index.called

    @pytest.fixture
    def celery(self, patch):
        cel = patch('h.annotation_sync.celery')
        cel.request = DummyRequest(es=mock.Mock(), feature=mock.Mock())
        cel.request.feature.return_value = True
        return cel

    @pytest.fixture
    def index(self, patch):
        return patch('h.annotation_sync.index')

    @pytest.fixture
    def delete(self, patch):
        return patch('h.annotation_sync.delete')


@pytest.mark.usefixtures('index_annotation')
class TestSubscribeAnnotationEvent(object):

    def test_it_skips_enqueueing_when_postgres_is_off(self, index_annotation):
        event = self.event()
        event.request.feature.return_value = False

        assert not index_annotation.delay.called

    def test_it_presents_the_annotation(self, AnnotationJSONPresenter):
        event = self.event()
        event.request.feature.return_value = True

        annotation_sync.subscribe_annotation_event(event)

        AnnotationJSONPresenter.assert_called_once_with(event.request,
                                                        event.annotation)

    def test_it_enqueues_a_celery_task(self, AnnotationJSONPresenter, index_annotation):
        event = self.event()
        event.request.feature.return_value = True

        annotation_sync.subscribe_annotation_event(event)

        presented = AnnotationJSONPresenter.return_value.asdict.return_value
        index_annotation.delay.assert_called_once_with(event.action, presented)

    def event(self):
        return mock.Mock(
            spec=events.AnnotationEvent(DummyRequest(),
                                        mock.Mock(spec=models.Annotation()),
                                        'create'),
            action='create',
        )

    @pytest.fixture
    def AnnotationJSONPresenter(self, patch):
        return patch('h.annotation_sync.presenters.AnnotationJSONPresenter')

    @pytest.fixture
    def index_annotation(self, patch):
        return patch('h.annotation_sync.index_annotation')
