import BaseWidget from './BaseWidget.js';
import {settings, select} from '../settings.js';
import {utils} from '../utils.js';

class HourPicker extends BaseWidget {
  constructor (wrapper) {
    super(wrapper, settings.hours.open);
    const thisWidget = this;
    thisWidget.dom = {};
    thisWidget.dom.wrapper = wrapper;
    thisWidget.dom.input = thisWidget.dom.wrapper.querySelector(select.hourPicker.input);
    thisWidget.dom.output = thisWidget.dom.wrapper.querySelector(select.hourPicker.output);

    thisWidget.initPlugin();

    thisWidget.value = thisWidget.dom.input.value;
    thisWidget.dom.output.innerHTML = utils.numberToHour(thisWidget.value);
  }
  parseValue (value) {
    return value;
  }
  isValid () {
    return true;
  }
  initPlugin () {
    const thisWidget = this;
    rangeSlider.create(thisWidget.dom.input);
    thisWidget.dom.input.addEventListener('input', function () {
      thisWidget.value = thisWidget.dom.input.value;
    });

  }
  renderValue () {
    const thisWidget = this;
    thisWidget.dom.output.innerHTML = utils.numberToHour(thisWidget.value); // ?
  }

}
export default HourPicker;
