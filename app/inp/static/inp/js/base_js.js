
// Функция для обновления индекса элемента
function updateElementIndex(el, prefix, ndx) {
    var id_regex = new RegExp('(' + prefix + '-\\d+)');    // Создаем регулярное выражение для поиска идентификатора элемента
    var replacement = prefix + '-' + ndx;   // Заменяем идентификатор элемента на новый
    // Если элемент имеет атрибут "for", заменяем его значение
    if ($(el).attr("for"))
        $(el).attr("for", $(el).attr("for").replace(id_regex, replacement));
    // Если элемент имеет атрибут id, заменяем его значение
    if (el.id)
        el.id = el.id.replace(id_regex, replacement);
    // Если элемент имеет атрибут name, заменяем его значение
    if (el.name)
        el.name = el.name.replace(id_regex, replacement);
}

// Функция для клонирования элемента и добавления его к форме
function cloneMore(selector, prefix) {
    var newElement = $(selector).clone(true);   // Клонируем элемент с селектором
    var total = $('#id_' + prefix + '-TOTAL_FORMS').val();  // Получаем текущее значение счетчика элементов

    // Проходим по всем элементам внутри клонированного элемента
    newElement.find(':input:not([type=button]):not([type=submit]):not([type=reset])').each(function() {
        // Заменяем имя и идентификатор элемента, увеличивая счетчик на 1
        var name = $(this).attr('name').replace('-' + (total - 1) + '-', '-' + total + '-');
        var id = 'id_' + name;
        var placeholder = 'input name ' + total;  // Генерируем значение для атрибута placeholder
        $(this).attr({'name': name, 'id': id, 'placeholder': placeholder}).val('').removeAttr('checked');
    });

    // Увеличиваем счетчик элементов на 1
    total++;
    $('#id_' + prefix + '-TOTAL_FORMS').val(total);

    // Добавляем клонированный элемент после выбранного элемента
    $(selector).after(newElement);

    return false;
}

// Функция для удаления формы
function deleteForm(prefix, btn) {
    // Получаем текущее значение счетчика элементов
    var total = parseInt($('#id_' + prefix + '-TOTAL_FORMS').val());

    // Проверяем, что количество элементов больше 1
    if (total > 1) {
        // Удаляем ближайший родительский элемент с классом "form-row"
        btn.closest('.form-row').remove();

        $('#id_' + prefix + '-TOTAL_FORMS').val(total - 1);

        // Обновляем счетчик элементов
        var forms = $('.form-row');
        $('#id_' + prefix + '-TOTAL_FORMS').val(forms.length);

        // Обновляем индексы всех элементов в оставшихся формах
        for (var i = 0, formCount = forms.length; i < formCount; i++) {
            $(forms.get(i)).find(':input').each(function() {updateElementIndex(this, prefix, i);
            });
        }
    }

    return false;
}

// Обработчики событий для кнопок добавления и удаления формы
$(document).on('click', '#add_button', function(e) {
    e.preventDefault();
    cloneMore('.form-row:last', 'form');
    return false;
});

$(document).on('click', '.delete-button', function(e) {
    e.preventDefault();
    deleteForm('form', $(this));
    return false;
});
