from django.shortcuts import render, redirect
from django.views import View
from django.views.generic import ListView
from .forms import FormInpSet
from .models import InpSave



class InpSub(View):
    def get(self, request):
        formset = FormInpSet()
        return render(request, 'inp/index.html', {'formset': formset})

    def post(self, request):
        formset = FormInpSet(request.POST)
        if formset.is_valid():
            name = formset.cleaned_data  # .get('name')
            input_instance = InpSave.objects.create(name=name)
            input_instance.save()
        return redirect('post_list')

class OutSub(ListView):
    model = InpSave
    template_name = 'inp/post_out.html'
    context_object_name = 'json_set'
