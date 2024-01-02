const address = document.querySelector("#input");
const headers = document.querySelector("#headers .input-1");
const body = document.querySelector("#body .input-1");
const options = document.querySelector("#options .input-1");
const dropdownButton = document.querySelector(".dropdown > button");
const dropdownContent = document.querySelector(".dropdown > ul");
let method = "GET";

function setMethod(t) {
  method = t;
  document.querySelector(".dropdown > button .name").innerText = t;
  dropdownContent.classList.remove("active");
}

function closeDropdown() {
  dropdownContent.classList.remove("active");
}

if (localStorage.getItem("cancel")) {
  const items = JSON.parse(localStorage.getItem("cancel"));
  address.value = items.address;
  headers.innerText = items.headers;
  body.innerText = items.body;
  options.innerText = items.options;
  localStorage.removeItem("cancel");
}

dropdownButton.addEventListener("click", () => {
  if (dropdownContent.classList.contains("active")) {
    dropdownContent.classList.remove("active");
  } else {
    dropdownContent.classList.add("active");
  }
});

function setTab(id, current) {
  const element = document.querySelector(`#${id}`);
  var parent = element.parentNode;
  var siblings = Array.from(parent.children);
  siblings = siblings.filter(function (sibling) {
    return sibling !== element;
  });
  siblings.forEach(function (sibling) {
    sibling.classList.remove("active");
  });

  var panel = current.parentNode;
  var buttons = Array.from(panel.children);
  buttons = buttons.filter(function (button) {
    return button !== current;
  });
  buttons.forEach(function (button) {
    button.classList.remove("active");
  });
  element.classList.add("active");
  current.classList.add("active");
}

function save(
  settings = {
    cancel: false,
  },
) {
  const address = document.querySelector("#input").value;
  const headers = document.querySelector("#headers .input-1").innerText;
  const body = document.querySelector("#body .input-1").innerText;
  const options = document.querySelector("#options .input-1").innerText;
  const data = {
    address,
    headers,
    body,
    options,
  };
  if (settings.cancel) {
    localStorage.setItem("cancel", JSON.stringify(data));
  } else {
    localStorage.setItem("save", JSON.stringify(data));
  }
}

function cancelRequest() {
  save({
    cancel: true,
  });
  window.location.reload();
}

function send_request() {
  const address = document.querySelector("#input").value;
  const headers =
    "{" + document.querySelector("#headers .input-1").innerText + "}";
  const body = "{" + document.querySelector("#body .input-1").innerText + "}";
  const options = document.querySelector("#options .input-1").innerText;

  const data = {
    address: address,
    headers: headers,
    body: body,
    options: options,
    method,
  };

  document.querySelector("#send").classList.add("danger");
  document.querySelector("#send").innerText = "Cancel";
  document.querySelector("#send").addEventListener("click", cancelRequest);

  document.querySelector("#iframe-id").src = address;

  fetch("/fetch", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((res) => res.json())
    .then((response) => {
      const data = response.result;
      try {
        const jsonData = JSON.parse(data);
        document.querySelector(".raw-content").innerText = JSON.stringify(
          jsonData,
          null,
          4,
        );
      } catch (e) {
        document.querySelector(".raw-content").innerText = data;
      }

      document.querySelector(".status-p").innerText = response.status;

      for (const [key, value] of Object.entries(response.headers)) {
        document.querySelector("#outputheaders .input-1").innerHTML += `
        <div>"${key}": "${value}"</div>
        `;
      }

      const htmlLoad = document.querySelector("#load-html");
      const rawhtml = document.querySelector("#rawhtml-load");

      htmlLoad.contentDocument.open();
      var regex = /<link\s+rel="stylesheet"\s+href="(?!https:\/\/).*?"\s*\/>/g;
      function replaceHttps(match) {
        return match.replace('href="', `href="${address}`);
      }
      var regex2 = /<script[^>]+src="(?!https:\/\/).*?"[^>]*><\/script>/g;
      function replaceScript(match) {
        return match.replace('src="', `src="${address}`);
      }
      htmlLoad.contentDocument.write(
        data.replace(regex2, replaceScript).replace(regex, replaceHttps),
      );
      htmlLoad.contentDocument.close();
      rawhtml.contentDocument.open();
      rawhtml.contentDocument.write(data);
      rawhtml.contentDocument.close();
      document.querySelector("#send").classList.remove("danger");
      document.querySelector("#send").innerText = "Send";
      document
        .querySelector("#send")
        .removeEventListener("click", cancelRequest);
    });
}
