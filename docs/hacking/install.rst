Installing h in a development environment
#########################################

This document contains instructions for setting up a development environment
for h. If you are looking for instructions for deploying h in a production
environment, please consult the :doc:`/INSTALL` document instead.


Requirements
------------

To run h in a development environment you'll need these system dependencies
installed:

-  Git_
-  Python_ v2.7
-  Node_ v4+ and its package manager, npm

You'll also need to run these external services:

.. include:: services.rst

.. _Git: https://git-scm.com/
.. _Python: http://python.org/
.. _Node: http://nodejs.org/


The following sections will explain how to install these system dependencies
and services.


Installing the system dependencies
----------------------------------

Installing h's system dependencies is different on different operating systems.
Follow either the
`Installing the system dependencies on Ubuntu 14.04`_ or the
`Installing the system dependencies on OS X`_ section below.


Installing the system dependencies on Ubuntu 14.04
``````````````````````````````````````````````````

This section describes how to install h's system dependencies on Ubuntu 14.04.
These steps will also probably work with few or no changes on other versions
of Ubuntu, Debian, or other Debian-based GNU/Linux distributions.

Install the following packages:

.. code-block:: bash

    sudo apt-get install -y --no-install-recommends \
        build-essential \
        git \
        libevent-dev \
        libffi-dev \
        libfontconfig \
        libpq-dev \
        python-dev \
        python-pip \
        python-virtualenv

Install node by following the
`instructions on nodejs.org <https://nodejs.org/en/download/package-manager/>`_
(the version of the nodejs package in the standard Ubuntu repositories is too
old).

Upgrade pip, virtualenv and npm:

.. code-block:: bash

    sudo pip install -U pip virtualenv
    sudo npm install -g npm


Installing the system dependencies on OS X
``````````````````````````````````````````

This section describes how to install h's system dependencies on Mac OS X.

The instructions that follow assume you have previously installed Homebrew_.

.. _Homebrew: http://brew.sh/

Install the following packages:

.. code-block:: bash

    brew install \
        libevent \
        libffi \
        node \
        python


Installing the services
-----------------------

h requires the following external services:

.. include:: services.rst

You can install these services however you want, but the easiest way is by
using Docker. This should work on any operating system that Docker can be
installed on:

1. Install Docker by following the instructions on the
   `Docker website`_.

2. Download and run the
   `official RabbitMQ image <https://hub.docker.com/_/rabbitmq/>`_,
   the `official PostgreSQL image <https://hub.docker.com/_/postgres/>`_, the
   `official Redis image <https://hub.docker.com/_/redis/>`_,
   and our custom
   `Elasticsearch with ICU image <https://hub.docker.com/r/nickstenning/elasticsearch-icu/>`_:

   .. code-block:: bash

      docker run -d --name postgres -p 5432:5432 postgres
      docker run -d --name elasticsearch -p 9200:9200 -p 9300:9300 nickstenning/elasticsearch-icu
      docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 --hostname rabbit rabbitmq:3-management
      docker run -d --name redis -p 6379:6379 redis

   You'll now have four Docker containers named ``postgres``, ``elasticsearch``,
   ``rabbitmq`` and ``redis`` running and exposing their various services on the
   ports defined above. You should be able to see them by running ``docker ps``.
   You should also be able to visit your Elasticsearch service by opening
   http://127.0.0.1:9200/ in a browser, and connect to your PostgreSQL by
   running ``psql postgresql://postgres@localhost/postgres`` (if you have psql
   installed).

   .. note::

      You only need to run the above ``docker run`` commands once. If you need
      to start the containers again (for example after restarting your
      computer), you can just run:

      .. code-block:: bash

         docker start postgres elasticsearch rabbitmq redis

3. Create the `htest` database in the ``postgres`` container. This is needed
   to run the h tests:

   .. code-block:: bash

      docker run -it --link postgres:postgres --rm postgres sh -c 'exec psql -h "$POSTGRES_PORT_5432_TCP_ADDR" -p "$POSTGRES_PORT_5432_TCP_PORT" -U postgres -c "CREATE DATABASE htest;"'


.. tip::

   You can use the PostgreSQL Docker image to open a psql shell to your
   Dockerized database without having to install psql on your host machine.
   Do:

   .. code-block:: bash

      docker run -it --link postgres:postgres --rm postgres sh -c 'exec psql -h "$POSTGRES_PORT_5432_TCP_ADDR" -p "$POSTGRES_PORT_5432_TCP_PORT" -U postgres'

   This runs psql in a fourth Docker container (from the same official
   PostgreSQL image, which also contains psql) and links it to your named
   ``postgres`` container using Docker's container linking system.
   The psql container is automatically removed (``--rm``) when you exit the
   psql shell.

.. tip::

   Use the ``docker logs`` command to see what's going on inside your
   Docker containers, for example:

   .. code-block:: bash

      docker logs rabbitmq

   For more on how to use Docker see the `Docker website`_.


.. _Docker website: https://www.docker.com/


Installing the gulp command
---------------------------

Install ``gulp-cli`` to get the ``gulp`` command:

.. code-block:: bash

    sudo npm install -g gulp-cli


Getting the h source code from GitHub
-------------------------------------

Use ``git`` to download the h source code:

.. code-block:: bash

    git clone https://github.com/hypothesis/h.git

This will download the code into an ``h`` directory in your current working
directory.

Change into the ``h`` directory from the remainder of the installation
process:

.. code-block:: bash

   cd h


Creating a Python virtual environment
-------------------------------------

Create a Python virtual environment to install and run the h Python code and
Python dependencies in:

.. code-block:: bash

   virtualenv .venv


.. _activating_your_virtual_environment:

Activating your virtual environment
-----------------------------------

Activate the virtual environment that you've created:

.. code-block:: bash

   source .venv/bin/activate

.. tip::

   You'll need to re-activate this virtualenv with the
   ``source .venv/bin/activate`` command each time you open a new terminal,
   before running h.
   See the `Virtual Environments`_ section in the Hitchhiker's guide to
   Python for an introduction to Python virtual environments.

.. _Virtual Environments: http://docs.python-guide.org/en/latest/dev/virtualenvs/


Running h
---------

Start the Hypothesis web service:

.. code-block:: bash

    make dev

The first time you run ``make dev`` it might take a while to start because
it'll need to install the application dependencies and build the client assets.

This will start the server on port 5000 (http://localhost:5000), reload the
application whenever changes are made to the source code, and restart it should
it crash for some reason.

If you are making changes to the client, or the JavaScript code or styles for the
service, you may find it useful to run this command from your ``h`` directory
in a separate terminal:

.. code-block:: bash

    gulp watch

``gulp watch`` will automatically rebuild the assets whenever the source files
change.

When ``gulp watch`` is running, you can visit http://localhost:3000
to see a page with an embedded Hypothesis client which will automatically reload
when styles, templates or JavaScript source files are changed.

.. _Gulp: http://gulpjs.com/


Running the WebSocket for real-time features
--------------------------------------------

To test h's real-time features (for example, seeing new or updated annotations
from other users appear in your browser without a page reload) you need to run
a websocket process.  Open a new terminal, ``cd`` into your ``h`` directory,
:ref:`activate your Python virtual environment <activating_your_virtual_environment>`,
then run:

.. code-block:: bash

   gunicorn --reload --paste conf/development-websocket.ini


Running Celery for background tasks
-----------------------------------

To test h's background tasks (for example, sending emails) you need to run a
Celery worker process.
Open a new terminal, ``cd`` into your ``h`` directory,
:ref:`activate your Python virtual environment <activating_your_virtual_environment>`,
then run:

.. code-block:: bash

    CONFIG_URI=conf/development-app.ini hypothesis-celery worker


.. _running-the-tests:

Running the tests
-----------------

There are test suites for both the frontend and backend code. To run the
complete set of tests, run:

.. code-block:: bash

    make test

To run the frontend test suite only, run the appropriate test task with gulp.
For example:

.. code-block:: bash

    gulp test-app

When working on the front-end code, you can run the Karma test runner in
auto-watch mode which will re-run the tests whenever a change is made to the
source code. To start the test runner in auto-watch mode, run:

.. code-block:: bash

    gulp test-watch-app

To run only a subset of tests for front-end code, use the ``--grep``
argument or mocha's `.only()`_ modifier.

.. code-block:: bash

    gulp test-watch-app --grep <pattern>

.. _.only(): http://jaketrent.com/post/run-single-mocha-test/


Debugging h
-----------

The `pyramid_debugtoolbar`_ package is loaded by default in the development
environment.  This will provide stack traces for exceptions and allow basic
debugging. A more advanced profiler can also be accessed at the /_debug_toolbar
path.

    http://localhost:5000/_debug_toolbar/

Check out the `pyramid_debugtoolbar documentation`_ for information on how to
use and configure it.

.. _pyramid_debugtoolbar: https://github.com/Pylons/pyramid_debugtoolbar
.. _pyramid_debugtoolbar documentation: http://docs.pylonsproject.org/projects/pyramid-debugtoolbar/en/latest/

You can turn on SQL query logging by setting the :envvar:`DEBUG_QUERY`
environment variable (to any value). Set it to the special value ``trace`` to
turn on result set logging as well.


Feature flags
-------------

Features flags allow admins to enable or disable features for certain groups
of users. You can enable or disable them from the Administration Dashboard.

To access the Administration Dashboard, you will need to first create a
user account in your local instance of H and then give that account
admin access rights using H's command-line tools.

See the :doc:`../administration` documentation for information
on how to give the initial user admin rights and access the Administration
Dashboard.


Troubleshooting
---------------


Cannot connect to the Docker daemon
```````````````````````````````````

If you get an error that looks like this when trying to run ``docker``
commands::

 Cannot connect to the Docker daemon. Is the docker daemon running on this host?
 Error: failed to start containers: postgres

it could be because you don't have permission to access the Unix socket that
the docker daemon is bound to. On some operating systems (e.g. Linux) you need
to either:

* Take additional steps during Docker installation to give your Unix user
  access to the Docker daemon's port (consult the installation
  instructions for your operating system on the `Docker website`_), or

* Prefix all ``docker`` commands with ``sudo``.
