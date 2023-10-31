from django.db import models


class InpSave(models.Model):
    name = models.JSONField()
