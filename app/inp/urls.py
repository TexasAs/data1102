from django.urls import path
from .views import *


urlpatterns = [
    path('', InpSub.as_view(), name='home'),
    path('out/', OutSub.as_view(), name='post_list'),
]