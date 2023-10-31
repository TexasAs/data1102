from django import forms
from django.forms import formset_factory


class FormInp(forms.Form):
    name = forms.CharField(widget=forms.TextInput(attrs={'placeholder': 'input name'}))

FormInpSet = formset_factory(FormInp, extra=1)



