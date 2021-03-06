var SYNC_QUOTA = chrome.storage.sync.QUOTA_BYTES_PER_ITEM;

function saveOptions() {
  var select = document.getElementById("storage_type");
  var storage_type = select.children[select.selectedIndex].value;
  localStorage["storage_type"] = storage_type;
  chrome.runtime.sendMessage({event:'rebuildMenus'});

  Materialize.toast(chrome.i18n.getMessage('optionsSavedToastText'), 2000);
}

function restoreOptions() {
  var storage_type = localStorage["storage_type"];
  if (!storage_type)
    return;

  var select = document.getElementById("storage_type");
  for (var i = 0; i < select.children.length; i++) {
    var child = select.children[i];
    if (child.value == storage_type) {
      child.selected = "true";
      break;
    }
  }
}

function swapStorage() {
  chrome.storage.local.get('clipboard', function(localItems) {
    localItems.clipboard = localItems.clipboard || [];

    chrome.storage.sync.get('clipboard', function(syncItems) {
      syncItems.clipboard = syncItems.clipboard || [];

      chrome.storage.sync.set({'clipboard': localItems.clipboard}, function() {
        if (chrome.runtime.lastError) {
          Materialize.toast(chrome.i18n.getMessage('storageSwappingFailedMessage') + chrome.runtime.lastError.message, 4000);
          analytics.trackEvent('Options', 'Swap Failed');
          return;
        }
        chrome.storage.local.set({'clipboard': syncItems.clipboard});
        chrome.runtime.sendMessage({event:'rebuildMenus'});

        Materialize.toast(chrome.i18n.getMessage('optionsSuccess'), 4000);
        calculateAndSetFillBar();

        analytics.trackEvent('Options', 'Swap Success');
      });
    });

  });
}

function getStorageColorClass(percent) {
  if (typeof(percent) != typeof(0.1))
    return "black";
  if (percent < 0 || percent > 1)
    return "blue";
  if (percent < 0.8)
    return "light-green";
  if (percent < 0.95)
    return "orange";
  return "red";
}

function calculateAndSetFillBar() {
  chrome.storage.sync.get({'clipboard':[]}, function(syncItems) {
    if (!(syncItems.clipboard instanceof Array))
      return;

    $("#option_storage_usage").empty();
    $("#option_storage_usage").append(chrome.i18n.getMessage("optionStorageUsage"));

    var size = computeObjectSize(syncItems.clipboard);
    var percentage = size/SYNC_QUOTA;
    $('#progress_progress').width(Math.floor(percentage*100)+'%');
    $('#progress_progress').removeClass('black blue light-green orange red').addClass(getStorageColorClass(percentage));
    $('#option_storage_usage').append(Math.floor(percentage*100)+"%");
  });
}

function computeObjectSize(object) {
  return JSON.stringify(object).length;
}

function init_i18n() {
  document.title = chrome.i18n.getMessage("optionsText");
  $("#title").append(chrome.i18n.getMessage("optionsText"));
  $("#option_sync_type_text").append(chrome.i18n.getMessage("optionStorageTypeText"));
  $("#option_sync_text").html(chrome.i18n.getMessage("optionSyncText"));
  $("#option_swap_storages_text").append(chrome.i18n.getMessage("optionSwapStorageText"));
  $("#option_swap_storage_btn_text").text(chrome.i18n.getMessage("optionSwapText"));
  $("#option_local_text").html(chrome.i18n.getMessage("optionLocalText"));
  $("#storage-card-title").text(chrome.i18n.getMessage("optionStorageCardTitle"));
  $('#option-name__translation-credits').text(chrome.i18n.getMessage('translatorsTitle'));

  $("#option_sync_tip").append(chrome.i18n.getMessage("optionSyncTip"));
  $("#option_used_storage_tip").append(chrome.i18n.getMessage("optionsStorageSizeHelp"));
  $("#option_swap_tip").append(chrome.i18n.getMessage("optionsSwapStoragesHelp"));

  $("#save").text(chrome.i18n.getMessage("optionsSave"));
  $('#donate_button').append(chrome.i18n.getMessage('donateWithPaypal'));
}

function submitDonateForm() {
  $('#donate_form').submit();
}

$(document).ready(function() {
  init_i18n();
  restoreOptions();
  $('select').material_select();
  $('.modal').modal();
  calculateAndSetFillBar();
  $("#save").click(saveOptions);
  $('#option_swap_storage_btn_text').click(swapStorage);
  $('#donate_button').click(submitDonateForm);
  analytics.trackEvent('Options', 'Opened');
});
