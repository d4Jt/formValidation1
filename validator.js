// Constructor function Validator
// Đối tượng `Validator`
function Validator(options) {
  function getParent(element, selector) {
    while (element.parentElement) {
      // kiểm tra xem  element có match với css selector hay k
      if (element.parentElement.matches(selector)) {
        return element.parentElement;
      }
      // gán parentElement vào element để đi kiểm tra tiếp
      element = element.parentElement;
    }
  }

  var selectorRules = {};

  // Hàm thực hiện validate
  function validate(inputElement, rule) {
    // trả giá trị sau khi test input
    var errorMessage;
    // lấy ra form-message của riêng thẳng input đấy
    var errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorSelector);

    // Lấy ra các rules của selector
    var rules = selectorRules[rule.selector];
    // Lặp qua từng rule và kiểm tra
    // Nếu có lỗi thì dừng việc kiểm tra
    for (var i = 0; i < rules.length; i++) {
      switch (inputElement.type) {
        case "checkbox":
        case "radio":
          errorMessage = rules[i](formElement.querySelector(rule.selector + ":checked"));
          break;
        default:
          errorMessage = rules[i](inputElement.value);
      }
      if (errorMessage) {
        break;
      }
    }

    if (errorMessage) {
      errorElement.innerText = errorMessage;
      getParent(inputElement, options.formGroupSelector).classList.add("invalid");
    } else {
      errorElement.innerText = "";
      getParent(inputElement, options.formGroupSelector).classList.remove("invalid");
    }

    //  phủ định errorMessage
    return !errorMessage;
  }

  // Lấy element của form cần validate
  var formElement = document.querySelector(options.form);

  if (formElement) {
    // Kiểm tra khi bấm submit form
    formElement.onsubmit = function (e) {
      e.preventDefault();

      var isFormValid = true;

      // Lặp qua từng rules và validate
      options.rules.forEach(function (rule) {
        var inputElement = formElement.querySelector(rule.selector);

        var isValid = validate(inputElement, rule);
        if (!isValid) {
          isFormValid = false;
        }
      });

      if (isFormValid) {
        // Trường hợp submit với javascript
        if (typeof options.onSubmit === "function") {
          var enableInputs = formElement.querySelectorAll("[name]:not([disabled])");

          var formValues = Array.from(enableInputs).reduce(function (values, input) {
            switch (input.type) {
              case 'file':
                values[input.name] = input.files;
                break;
              case "checkbox":
                if (!input.matches(":checked")) {
                  values[input.name] = "";
                  return values;
                }
                if (!Array.isArray(values[input.name])) {
                  values[input.name] = [];
                }
                values[input.name].push(input.value);
                break;
              case "radio":
                // if (input.matches(":checked")) {
                //   values[input.name] = input.value;
                // }
                values[input.name] = formElement.querySelector('input[name="' + input.name + '"]:checked').value;
                break;
              default:
                values[input.name] = input.value;
            }

            return values;
          }, {});

          options.onSubmit(formValues);
        }
        // Trường hợp submit với hành vi mặc định
        else {
          // submit với hành vi mặc định của trình duyệt
          formElement.submit();
        }
      }
    };

    // Lặp qua mỗi rule và xử lý (lắng nghe sự kiện blur, input, ...)
    options.rules.forEach(function (rule) {
      // Lưu lại các rule cho mỗi input
      if (Array.isArray(selectorRules[rule.selector])) {
        selectorRules[rule.selector].push(rule.test);
      } else {
        selectorRules[rule.selector] = [rule.test];
      }

      // Lặp qua từng rule để validate
      var inputElements = formElement.querySelectorAll(rule.selector);
      Array.from(inputElements).forEach(function (inputElement) {
        // Xử lý trường hợp blur khỏi input
        inputElement.onblur = function () {
          validate(inputElement, rule);
        };

        // Xử lý khi người dùng đang nhập vào input
        inputElement.oninput = function () {
          var errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorSelector);

          errorElement.innerText = "";
          getParent(inputElement, options.formGroupSelector).classList.remove("invalid");
        };
      });
    });
  }
}

// Định nghĩa các rules
// Nguyên tắc:
/*      1.Khi có lỗi => Trả ra msg lỗi
        2.Khi không có lỗi => Ko trả ra gì cả
        */
Validator.isRequired = function (selector, message) {
  return {
    selector, //es6
    test: function (value) {
      // tạm bỏ trim() để kiểm tra checkbox, radio
      return value ? undefined : message || "Vui lòng nhập trường này";
    },
  };
};

Validator.isEmail = function (selector, message) {
  return {
    selector, //es6
    test: function (value) {
      // đoạn mã xác thực một id email
      var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

      return regex.test(value) ? undefined : message || "Email không hợp lệ";
    },
  };
};

Validator.minLength = function (selector, min, message) {
  return {
    selector, //es6
    test: function (value) {
      return value.length >= min ? undefined : message || `Vui lòng nhập tối thiểu ${min} ký tự`;
    },
  };
};

Validator.isConfirmed = function (selector, getConfirmedValue, message) {
  return {
    selector, //es6
    test: function (value) {
      var confirmedValue = getConfirmedValue();
      return confirmedValue === value ? undefined : message || "Giá trị nhập vào không đúng";
    },
  };
};
