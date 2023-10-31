# Инструкция по развертыванию приложения Django с помощью uWSGI и Nginx в деплой

1. Подготовим среду для нашего проекта и установим  необходимые зависимости

>sudo apt update
>sudo apt install git
>sudo apt install python3-pip

Теперь, когда у нас установлен pip, устанавливаем virtualenv и virtualenvwrapper 

>sudo -H pip3 install --upgrade pip
>sudo -H pip3 install virtualenv virtualenvwrapper

Настроим нашу оболочку, включив в нее информацию, необходимую для работы со сценарием virtualenvwrapper. 

>echo "export VIRTUALENVWRAPPER_PYTHON=/usr/bin/python3" >> ~/.bashrc

>echo "export WORKON_HOME=~/Env" >> ~/.bashrc

>echo "source /usr/local/bin/virtualenvwrapper.sh" >> ~/.bashrc

>source ~/.bashrc

Теперь в домашней дериктории должен появится каталог __Env__, это директория виртуального окружения.

Cоздаем виртуальное окружение и устанавливаем в него джанго а также драйвер для PostgreSQL (если есть requirements.txt устанавливаем зависимости из него)

>mkvirtualenv app
>pip install django psycopg2-binary

Cделаем нашу директорию текущей

>cd ~

Клонируем репозиторий проекта Django в текущую директорию

2. Настраиваем Postgre и Django

Создадим базу данных и пользователя, зайдем в консоль postge командой:

>sudo -u postgres psql

в консоли создаем юзера:

>CREATE USER texas WITH PASSWORD 1234;

создаем базу данных:

>CREATE DATABASE inp_db;

и наделяем юзера привелегиями:

>GRANT ALL PRIVILEGES ON DATABASE inp_db TO texas;

Теперь поработаем с проектом Django. Перейдем в директорию проекта

>cd ~/app

Редактором nano отредактируем settings.py:

nano ~/app/app/settings.py 

и внесем в него следующие изменения:

- импортируем модуль оs

__import os__

- внесем IP нашего хоста (хост рандомный, у вас будет свой)

__ALLOWED_HOSTS = ['123.456.78.90', 'другие домены или IP при необходимости']__

- добавим STATIC_ROOT

__STATIC_ROOT = os.path.join(BASE_DIR, 'static/')__

- изменим настройки с MySQL на PostgreSQL

__DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'NAME': 'inp_db',
        'USER': 'texas',
        'PASSWORD': '1234',
        'HOST': '127.0.0.1',
        'PORT': 5432,
    }
}__

Теперь выполним миграции, создадим суперюзера, соберем статические файлы:

>~/app/manage.py migrate
>~/app/manage.py createsuperuser
>~/app/manage.py collectstatic

Если все сделали верно, то выполнив следующие команды в терминале и перейдя в браузере по адресу 123.456.78.90:8080 мы увидим нашу главную страницу проекта

>sudo ufw allow 8080
>~/app/manage.py runserver 0.0.0.0:8080

Деактивируем виртуальную среду:

>deactivate

При необходимости активировать виртуальную среду используется команда 

>workon app

3. Установка и настройка uWSGI

Устанавливаем необходимые пакеты

>sudo apt-get install python3-dev
>sudo -H pip3 install uwsgi

Создаем файлы конфигурации
Создаем каталог, в котором будут храниться файлы конфигурации. 

>sudo mkdir -p /etc/uwsgi/sites

Создаем файл data1985.ini открывая редактором nano, используем синтаксис %(имя_переменной) для удобства в использовании при содании новых конфигураций для других проектов

>sudo nano /etc/uwsgi/sites/data1102.ini

и заполняем его следующим содержимым:
___
    [uwsgi]
    project = app
    uid = texas
    base = /home/%(uid)

    chdir = %(base)/%(project)
    home = %(base)/Env/%(project)
    module = %(project).wsgi:application

    master = true
    processes = 5

    socket = /run/uwsgi/%(project).sock
    chown-socket = %(uid):www-data
    chmod-socket = 664
    vacuum = true
___

сохраняем ctrl+O и выходим из редактора nano ctrl+X

Создаем файл модуля в каталоге /etc/systemd/system, где хранятся файлы модуля, созданные администратором. Мы назовем наш файл uwsgi.service 

sudo nano /etc/systemd/system/uwsgi.service

и заполняем следующим:
___
    [Unit]
    Description=uWSGI Emperor service

    [Service]
    ExecStartPre=/bin/bash -c 'mkdir -p /run/uwsgi; chown texas:www-data /run/uwsgi'
    ExecStart=/usr/local/bin/uwsgi --emperor /etc/uwsgi/sites
    Restart=always
    KillSignal=SIGQUIT
    Type=notify
    NotifyAccess=all

    [Install]
    WantedBy=multi-user.target
___
сохраняем ctrl+O и выходим из редактора nano ctrl+X



4. Установка и настройка Nginx в качестве обратного прокси-сервера.

>sudo apt install nginx

Создаем файл конфигурации блока сервера для нашего проекта:

>sudo nano /etc/nginx/sites-available/data1102

и внесем в него следующее
___

    server {
        listen 80;
        server_name 123.456.78.90;

        location = /favicon.ico { access_log off; log_not_found off; }
        location /static/ {
            root /home/texas/data1102/app;
        }   

        location / {
            include         uwsgi_params;
            uwsgi_pass      unix:/run/uwsgi/app.sock;
        }
    }

___

сохраняем ctrl+O и выходим из редактора nano ctrl+X

Затем свяжем этот файл конфигурации с каталогом Nginx с поддержкой сайтов (создадим символическую ссылку):

>sudo ln -s /etc/nginx/sites-available/data1102 /etc/nginx/sites-enabled

Проверяем синтаксис конфигурации, набрав:

>sudo nginx -t

Перезагрузим nginx

>sudo systemctl restart nginx

и проверяем статус

>sudo systemctl status nginx

Запустим сервер uWSGI:

>sudo systemctl start uwsgi

Ранее назначали управление UFW для порта 8080 удалим его и вместо этого назначим доступ к нашему серверу Nginx:

>sudo ufw delete allow 8080
>sudo ufw allow 'Nginx Full'

Включаем автоматический запуск обеих служб при загрузке, набрав:

>sudo systemctl enable nginx
>sudo systemctl enable uwsgi

Теперь сервера работают в автономном режиме, и набрав в строке браузера наш внешний IP попадем на главную страницу Django проекта
