// ============================================================
// DYFI Padanolsavam | Meenara Unit — Google Apps Script Backend
// ============================================================
// Deploy as: Web App | Execute as: Me | Access: Anyone
// ============================================================

var SHEET_ID = '1mzdn6Pi3czxgLOONuZ_nEglKmOnyJroH3JXi-FD9oZg';
var FOLDER_ID = '1IdnOAUg21J6NGXvWEazCDx98fC8oeEkh';

// ---- Response Helpers ----

function respond(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function ok(data, message) {
  return respond({ success: true, data: data || null, message: message || 'OK' });
}

function err(message) {
  return respond({ success: false, data: null, message: message });
}

// ---- Sheet Helpers ----

function getSheet(name) {
  return SpreadsheetApp.openById(SHEET_ID).getSheetByName(name);
}

function getSheetData(name) {
  var sheet = getSheet(name);
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  var headers = values[0];
  return values.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) { obj[h] = row[i]; });
    return obj;
  });
}

function appendRow(sheetName, rowObj) {
  var sheet = getSheet(sheetName);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var row = headers.map(function(h) { return rowObj[h] !== undefined ? rowObj[h] : ''; });
  sheet.appendRow(row);
}

function updateRow(sheetName, idValue, updates) {
  var sheet = getSheet(sheetName);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idCol = headers.indexOf('id');
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(idValue)) {
      Object.keys(updates).forEach(function(key) {
        var col = headers.indexOf(key);
        if (col !== -1) sheet.getRange(i + 1, col + 1).setValue(updates[key]);
      });
      return true;
    }
  }
  return false;
}

function deleteRow(sheetName, idValue) {
  var sheet = getSheet(sheetName);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idCol = headers.indexOf('id');
  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][idCol]) === String(idValue)) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

// ---- Entry Points ----
// NOTE: Google Apps Script handles CORS automatically when deployed as
// "Anyone" access. The frontend uses text/plain to avoid preflight.

function doGet(e) {
  try {
    var params = e.parameter || {};
    var action = params.action;
    switch (action) {
      case 'getStudents': return handleGetStudents(params);
      case 'getFinance':  return handleGetFinance(params);
      case 'getUsers':    return handleGetUsers();
      case 'getSettings': return handleGetSettings();
      default: return err('Unknown action: ' + action);
    }
  } catch(ex) {
    return err('Server error: ' + ex.toString());
  }
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var action = body.action;
    switch (action) {
      case 'login':           return handleLogin(body);
      case 'changePassword':  return handleChangePassword(body);
      case 'addUser':         return handleAddUser(body);
      case 'updateUser':      return handleUpdateUser(body);
      case 'toggleUser':      return handleToggleUser(body);
      case 'addStudent':      return handleAddStudent(body);
      case 'updateStudent':   return handleUpdateStudent(body);
      case 'deleteStudent':   return handleDeleteStudent(body);
      case 'addIncome':       return handleAddIncome(body);
      case 'addExpense':      return handleAddExpense(body);
      case 'uploadFile':      return handleUploadFile(body);
      case 'updateSettings':  return handleUpdateSettings(body);
      case 'addYear':         return handleAddYear(body);
      default: return err('Unknown action: ' + action);
    }
  } catch(ex) {
    return err('Server error: ' + ex.toString());
  }
}

// ---- Auth ----

function handleLogin(body) {
  var mobile = String(body.mobile || '').trim();
  var password = String(body.password || '').trim();
  if (!mobile || !password) return err('Mobile and password required');

  var users = getSheetData('users');
  var user = null;
  for (var i = 0; i < users.length; i++) {
    if (String(users[i].mobile).trim() === mobile) { user = users[i]; break; }
  }
  if (!user) return err('User not found');
  if (String(user.status).toLowerCase() !== 'active') return err('Account is inactive');
  if (String(user.password).trim() !== password) return err('Invalid password');

  var firstLogin = String(user.first_login).toUpperCase() === 'TRUE' || user.first_login === true;

  return ok({
    id: String(user.id),
    name: String(user.name),
    mobile: String(user.mobile),
    role: String(user.role),
    first_login: firstLogin
  }, 'Login successful');
}

function handleChangePassword(body) {
  if (!body.id || !body.newPassword) return err('ID and new password required');
  if (String(body.newPassword).length < 6) return err('Password must be at least 6 characters');
  var updated = updateRow('users', body.id, { password: body.newPassword, first_login: false });
  if (!updated) return err('User not found');
  return ok(null, 'Password changed successfully');
}

// ---- Users ----

function handleGetUsers() {
  var users = getSheetData('users').map(function(u) {
    return { id: u.id, name: u.name, mobile: u.mobile, role: u.role, status: u.status, first_login: u.first_login, created_at: u.created_at };
  });
  return ok(users);
}

function handleAddUser(body) {
  var name = String(body.name || '').trim();
  var mobile = String(body.mobile || '').trim();
  var role = body.role || 'user';
  if (!name || !mobile) return err('Name and mobile required');

  var existing = getSheetData('users').filter(function(u) { return String(u.mobile).trim() === mobile; });
  if (existing.length > 0) return err('User with this mobile already exists');

  var newUser = {
    id: Utilities.getUuid(),
    name: name,
    mobile: mobile,
    password: 'password',
    role: role,
    status: 'active',
    first_login: true,
    created_at: new Date().toISOString()
  };
  appendRow('users', newUser);
  return ok({ id: newUser.id }, 'User added');
}

function handleUpdateUser(body) {
  if (!body.id) return err('ID required');
  var updates = {};
  if (body.name) updates.name = body.name;
  if (body.role) updates.role = body.role;
  updateRow('users', body.id, updates);
  return ok(null, 'User updated');
}

function handleToggleUser(body) {
  if (!body.id) return err('ID required');
  var users = getSheetData('users');
  var user = null;
  for (var i = 0; i < users.length; i++) {
    if (String(users[i].id) === String(body.id)) { user = users[i]; break; }
  }
  if (!user) return err('User not found');
  var newStatus = String(user.status).toLowerCase() === 'active' ? 'inactive' : 'active';
  updateRow('users', body.id, { status: newStatus });
  return ok({ status: newStatus }, 'Status updated');
}

// ---- Students ----

function handleGetStudents(params) {
  var students = getSheetData('students');
  if (params.year) students = students.filter(function(s) { return String(s.year) === String(params.year); });
  if (params.added_by) students = students.filter(function(s) { return String(s.added_by) === String(params.added_by); });
  return ok(students);
}

function handleAddStudent(body) {
  var student = {
    id: Utilities.getUuid(),
    student_name: body.student_name || '',
    class: body.class || '',
    parent_phone: body.parent_phone || '',
    address: body.address || '',
    house_name: body.house_name || '',
    remarks: body.remarks || '',
    photo_url: body.photo_url || '',
    added_by: body.added_by || '',
    year: body.year || '',
    created_at: new Date().toISOString()
  };
  appendRow('students', student);
  return ok({ id: student.id }, 'Student added');
}

function handleUpdateStudent(body) {
  if (!body.id) return err('ID required');
  var fields = ['student_name','class','parent_phone','address','house_name','remarks','photo_url'];
  var updates = {};
  fields.forEach(function(f) { if (body[f] !== undefined) updates[f] = body[f]; });
  updateRow('students', body.id, updates);
  return ok(null, 'Student updated');
}

function handleDeleteStudent(body) {
  if (!body.id) return err('ID required');
  deleteRow('students', body.id);
  return ok(null, 'Student deleted');
}

// ---- Finance ----

function handleGetFinance(params) {
  var type = params.type;
  if (!type) return err('type required (income or expenses)');
  var rows = getSheetData(type);
  if (params.year) rows = rows.filter(function(r) { return String(r.year) === String(params.year); });
  return ok(rows);
}

function handleAddIncome(body) {
  var row = {
    id: Utilities.getUuid(),
    title: body.title || '',
    amount: body.amount || 0,
    category: body.category || '',
    payment_method: body.payment_method || '',
    remarks: body.remarks || '',
    year: body.year || '',
    created_by: body.created_by || '',
    created_at: new Date().toISOString()
  };
  appendRow('income', row);
  return ok({ id: row.id }, 'Income added');
}

function handleAddExpense(body) {
  var row = {
    id: Utilities.getUuid(),
    title: body.title || '',
    amount: body.amount || 0,
    category: body.category || '',
    payment_method: body.payment_method || '',
    bill_url: body.bill_url || '',
    remarks: body.remarks || '',
    year: body.year || '',
    created_by: body.created_by || '',
    created_at: new Date().toISOString()
  };
  appendRow('expenses', row);
  return ok({ id: row.id }, 'Expense added');
}

// ---- File Upload ----

function handleUploadFile(body) {
  if (!body.data) return err('No file data');
  var fileName = body.fileName || ('upload_' + Date.now());
  var mimeType = body.mimeType || 'image/jpeg';
  try {
    var folder = DriveApp.getFolderById(FOLDER_ID);
    var blob = Utilities.newBlob(Utilities.base64Decode(body.data), mimeType, fileName);
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    var fileId = file.getId();
    return ok({ url: 'https://drive.google.com/uc?id=' + fileId, fileId: fileId }, 'Uploaded');
  } catch(ex) {
    return err('Upload failed: ' + ex.toString());
  }
}

// ---- Settings ----

function handleGetSettings() {
  var settingsSheet = getSheet('settings');
  var settingsData = settingsSheet.getDataRange().getValues();
  var settings = {};
  if (settingsData.length > 1) {
    var headers = settingsData[0];
    headers.forEach(function(h, i) { settings[h] = settingsData[1][i]; });
  }
  var years = getSheetData('years');
  return ok({ settings: settings, years: years });
}

function handleUpdateSettings(body) {
  var sheet = getSheet('settings');
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var updates = { updated_at: new Date().toISOString() };
  if (body.default_year !== undefined) updates.default_year = body.default_year;
  if (body.app_name !== undefined) updates.app_name = body.app_name;

  if (data.length < 2) {
    var row = headers.map(function(h) { return updates[h] !== undefined ? updates[h] : ''; });
    sheet.appendRow(row);
  } else {
    Object.keys(updates).forEach(function(key) {
      var col = headers.indexOf(key);
      if (col !== -1) sheet.getRange(2, col + 1).setValue(updates[key]);
    });
  }
  return ok(null, 'Settings updated');
}

function handleAddYear(body) {
  var yearName = String(body.year_name || '').trim();
  if (!yearName) return err('Year name required');
  var existing = getSheetData('years').filter(function(y) { return y.year_name === yearName; });
  if (existing.length > 0) return err('Year already exists');
  var row = { id: Utilities.getUuid(), year_name: yearName, is_default: false };
  appendRow('years', row);
  return ok({ id: row.id }, 'Year added');
}
