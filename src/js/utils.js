/* global Handlebars, dataSource */
import {select, classNames} from './settings.js';
export const utils = {};

utils.createDOMFromHTML = function(htmlString) {
  let div = document.createElement('div');
  div.innerHTML = htmlString.trim();
  return div.firstChild;
};

utils.createPropIfUndefined = function(obj, key, value = []){
  if(!obj.hasOwnProperty(key)){
    obj[key] = value;
  }
};

utils.serializeFormToObject = function(form){
  let output = {};
  if (typeof form == 'object' && form.nodeName == 'FORM') {
    for (let field of form.elements) {
      if (field.name && !field.disabled && field.type != 'file' && field.type != 'reset' && field.type != 'submit' && field.type != 'button') {
        if (field.type == 'select-multiple') {
          for (let option of field.options) {
            if(option.selected) {
              utils.createPropIfUndefined(output, field.name);
              output[field.name].push(option.value);
            }
          }
        } else if ((field.type != 'checkbox' && field.type != 'radio') || field.checked) {
          utils.createPropIfUndefined(output, field.name);
          output[field.name].push(field.value);
        }
      }
    }
  }
  return output;
};

utils.queryParams = function(params){
  return Object.keys(params)
    .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
    .join('&');
};

utils.convertDataSourceToDbJson = function(){
  const productJson = [];
  for(let key in dataSource.products){
    productJson.push(Object.assign({id: key}, dataSource.products[key]));
  }

  console.log(JSON.stringify({product: productJson, order: []}, null, '  '));
};

utils.numberToHour = function(number){
  return (Math.floor(number) % 24) + ':' + (number % 1 * 60 + '').padStart(2, '0');
};

utils.hourToNumber = function(hour){
  const parts = hour.split(':');

  return parseInt(parts[0]) + parseInt(parts[1])/60;
};

utils.dateToStr = function(dateObj){
  return dateObj.toISOString().slice(0, 10);
};

utils.addDays = function(dateStr, days){
  const dateObj = new Date(dateStr);
  dateObj.setDate(dateObj.getDate() + days);
  return dateObj;
};

utils.activatePopUp = function (message, validated) {
  const popUp = document.querySelector(select.containerOf.popup);
  popUp.classList.add(classNames.popup.active);
  if (validated) {
    popUp.classList.add(classNames.popup.success);
  } else {
    popUp.classList.add(classNames.popup.warning);
  }
  const messageBox = document.createElement('span');
  messageBox.innerHTML = message;
  popUp.appendChild(messageBox);
  setTimeout (function () {
    popUp.classList.remove(classNames.popup.active);
    popUp.classList.remove(classNames.popup.success);
    popUp.classList.remove(classNames.popup.warning);
    popUp.removeChild(messageBox);
  }, 4000);
};

utils.validateInputs = function (form) {
  let isFormValidate = true;

  const addressValue = form.querySelector(select.form.address).value;
  const phoneValue = form.querySelector(select.form.phone).value;

  const phonePattern = /^[0-9]{9}$/;
  const addressPattern = /^([^\\u0000-\u007F]|\w)+,?\s\d+[A-z]?(\/\d+[A-z]?)?$/;

  if (!phonePattern.test(phoneValue)) {
    isFormValidate = false;
    utils.activatePopUp('Incorrect telephone number', isFormValidate);
  }
  else if (!addressPattern.test(addressValue)) {
    isFormValidate = false;
    utils.activatePopUp('Incorrect address ', isFormValidate);
  }

  return !isFormValidate ? false : true;
};

utils.preventSubmit = function (button) {
  button.disabled = true;
  setTimeout(function () {
    button.disabled = false;
  }, 4000);
};

Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
  return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('joinValues', function(input, options) {
  return Object.values(input).join(options.fn(this));
});
