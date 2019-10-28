import BaseWidget from './BaseWidget.js';
import {utils} from '../utils.js';
import {select, settings} from '../settings.js';


class DatePicker extends BaseWidget {
  constructor (wrapper) {
    super (wrapper, utils.dateToStr(new Date()));
    const thisWidget = this;
    thisWidget.dom = {};
    thisWidget.dom.wrapper  = wrapper;
    thisWidget.dom.input = thisWidget.dom.wrapper.querySelector(select.datePicker.input);

    thisWidget.initPlugin();
  }
  initPlugin () {
    const thisWidget = this;
    thisWidget.minDate = new Date(thisWidget.value);
    const minDateStr = utils.dateToStr(thisWidget.minDate);
    thisWidget.maxDate = utils.addDays(minDateStr, settings.datePicker.maxDaysInFuture);
    // initiate plugin flatpickr
    const flatpickrOptions = {
      defaultDate: thisWidget.minDate,
      minDate: thisWidget.minDate,
      maxDate: thisWidget.maxDate,
      disable: [
        function(date) {
          // return true to disable
          return (date.getDay() === 1);
        }
      ],
      locale: {
        firstDayOfWeek: 1, // start week on Monday
      },
      onChange: [

        function (selectedDates, dateStr, instance) {
          thisWidget.value = thisWidget.dom.input.value;
          thisWidget.announce();
        }
      ],
    };
    flatpickr(thisWidget.dom.input, flatpickrOptions);

  }
  parseValue  (value) {
    return value;
  }
  isValid () {
    return true;
  }
  renderValue () {

  }
}
export default DatePicker;
