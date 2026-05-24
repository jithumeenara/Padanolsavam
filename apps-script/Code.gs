// ============================================================
// DYFI Padanolsavam | Meenara Unit — Google Apps Script Backend
// ============================================================
// Deploy as: Web App | Execute as: Me | Access: Anyone
// ============================================================

var SHEET_ID = '1mzdn6Pi3czxgLOONuZ_nEglKmOnyJroH3JXi-FD9oZg';
var FOLDER_ID = '1IdnOAUg21J6NGXvWEazCDx98fC8oeEkh';

// ---- Sheet Setup (run once from Apps Script editor to initialise) ----
// Open Apps Script editor > Run > setupSheets  to auto-create all sheets.

function setupSheets() {
  var ss = SpreadsheetApp.openById(SHEET_ID);

  var SHEETS = {
    users:    ['id','name','mobile','password','role','status','first_login','created_at'],
    students: ['id','student_name','class','parent_phone','address','house_name','remarks','photo_url','added_by','year','created_at'],
    income:   ['id','title','amount','category','payment_method','remarks','year','created_by','created_at'],
    expenses: ['id','title','amount','category','payment_method','bill_url','remarks','year','created_by','created_at'],
    settings: ['default_year','app_name','updated_at'],
    years:    ['id','year_name','is_default']
  };

  Object.keys(SHEETS).forEach(function(name) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.appendRow(SHEETS[name]);
      sheet.getRange(1, 1, 1, SHEETS[name].length)
        .setFontWeight('bold')
        .setBackground('#f3f4f6');
    }
  });

  // Seed admin user if users sheet is empty
  var usersSheet = ss.getSheetByName('users');
  if (usersSheet.getLastRow() <= 1) {
    usersSheet.appendRow([
      Utilities.getUuid(), 'Admin', '8590551176', 'admin123',
      'admin', 'active', false, new Date().toISOString()
    ]);
  }

  // Seed default settings row if empty
  var settingsSheet = ss.getSheetByName('settings');
  if (settingsSheet.getLastRow() <= 1) {
    settingsSheet.appendRow(['', 'Padanolsavam', new Date().toISOString()]);
  }

  Logger.log('Setup complete. All sheets created/verified.');
}

// ---- CORS & Response Helpers ----

function setCorsHeaders(output) {
  return output
    .setMimeType(ContentService.MimeType.JSON);
}

function respond(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function ok(data, message) {
  return respond({ success: true, data: data || null, message: message || 'OK' });
}

function err(message) {
  return respond({ success: false, data: null, message: message });
}

// ---- Sheet Helper ----

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

function doGet(e) {
  try {
    var params = e.parameter || {};
    var action = params.action;
    switch (action) {
      case 'getStudents': return handleGetStudents(params);
      case 'getFinance':  return handleGetFinance(params);
      case 'getUsers':    return handleGetUsers(params);
      case 'getSettings': return handleGetSettings(params);
      default: return err('Unknown GET action: ' + action);
    }
  } catch(ex) {
    return err(ex.toString());
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
      default: return err('Unknown POST action: ' + action);
    }
  } catch(ex) {
    return err(ex.toString());
  }
}

// ---- Auth ----

function handleLogin(body) {
  var mobile = String(body.mobile || '').trim();
  var password = String(body.password || '').trim();
  if (!mobile || !password) return err('Mobile and password required');

  var users = getSheetData('users');
  var user = users.find(function(u) {
    return String(u.mobile) === mobile && u.status === 'active';
  });
  if (!user) return err('User not found or inactive');
  if (String(user.password) !== password) return err('Invalid password');

  return ok({
    id: user.id,
    name: user.name,
    mobile: user.mobile,
    role: user.role,
    first_login: user.first_login === true || user.first_login === 'TRUE' || user.first_login === true
  }, 'Login successful');
}

function handleChangePassword(body) {
  var id = body.id;
  var newPassword = body.newPassword;
  if (!id || !newPassword) return err('ID and new password required');
  if (newPassword.length < 6) return err('Password must be at least 6 characters');

  var updated = updateRow('users', id, { password: newPassword, first_login: false });
  if (!updated) return err('User not found');
  return ok(null, 'Password changed successfully');
}

// ---- Users ----

function handleGetUsers(params) {
  var users = getSheetData('users').map(function(u) {
    var copy = Object.assign({}, u);
    delete copy.password;
    return copy;
  });
  return ok(users);
}

function handleAddUser(body) {
  var name = (body.name || '').trim();
  var mobile = (body.mobile || '').trim();
  var role = body.role || 'user';
  if (!name || !mobile) return err('Name and mobile required');

  var existing = getSheetData('users').find(function(u) {
    return String(u.mobile) === mobile;
  });
  if (existing) return err('User with this mobile already exists');

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
  return ok({ id: newUser.id }, 'User added successfully');
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
  var user = users.find(function(u) { return String(u.id) === String(body.id); });
  if (!user) return err('User not found');
  var newStatus = user.status === 'active' ? 'inactive' : 'active';
  updateRow('users', body.id, { status: newStatus });
  return ok({ status: newStatus }, 'User status updated');
}

// ---- Students ----

function handleGetStudents(params) {
  var year = params.year;
  var addedBy = params.added_by;
  var students = getSheetData('students');
  if (year) students = students.filter(function(s) { return String(s.year) === String(year); });
  if (addedBy) students = students.filter(function(s) { return String(s.added_by) === String(addedBy); });
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
  var type = params.type; // 'income' or 'expenses'
  var year = params.year;
  if (!type) return err('type required');
  var rows = getSheetData(type);
  if (year) rows = rows.filter(function(r) { return String(r.year) === String(year); });
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
  var base64Data = body.data;
  var fileName = body.fileName || ('upload_' + Date.now());
  var mimeType = body.mimeType || 'image/jpeg';
  if (!base64Data) return err('No file data provided');

  var folder = DriveApp.getFolderById(FOLDER_ID);
  var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, fileName);
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  var fileId = file.getId();
  var url = 'https://lh3.googleusercontent.com/d/' + fileId;
  return ok({ url: url, fileId: fileId }, 'File uploaded');
}

// ---- Settings ----

function handleGetSettings(params) {
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
  var updates = {};
  if (body.default_year !== undefined) updates.default_year = body.default_year;
  if (body.app_name !== undefined) updates.app_name = body.app_name;
  updates.updated_at = new Date().toISOString();

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
  var yearName = (body.year_name || '').trim();
  if (!yearName) return err('Year name required');

  var existing = getSheetData('years').find(function(y) { return y.year_name === yearName; });
  if (existing) return err('Year already exists');

  var row = {
    id: Utilities.getUuid(),
    year_name: yearName,
    is_default: body.is_default === true ? true : false
  };
  appendRow('years', row);
  return ok({ id: row.id }, 'Year added');
}
