# معماری مدیریت لیدها (Lead Management Architecture)

## هدف
ایجاد سیستم مدیریت لید برای تقسیم کاربران (لیدها) بین فروشندگان تلفنی، ثبت تماس‌ها، و ردیابی عملکرد.

## مدل‌های پایگاه داده پیشنهادی

### 1. Lead (لید)
```go
type Lead struct {
    ID              uint      `gorm:"primaryKey" json:"id"`
    UserID          uint      `gorm:"index;not null" json:"user_id"` // ارجاع به User
    AssignedToID    *uint     `gorm:"index" json:"assigned_to_id"`   // کاربر ادمین که لید به او اختصاص داده شده
    Status          string    `gorm:"type:varchar(50);index;default:'new'" json:"status"` // new, contacted, qualified, converted, lost
    Priority        string    `gorm:"type:varchar(20);default:'medium'" json:"priority"` // low, medium, high
    Source          string    `gorm:"type:varchar(100)" json:"source"` // registration, webinar, etc.
    Notes           string    `gorm:"type:text" json:"notes"`
    LastContactedAt *time.Time `json:"last_contacted_at"`
    CreatedAt       time.Time `json:"created_at"`
    UpdatedAt       time.Time `json:"updated_at"`
    
    // Relations
    User         User       `gorm:"foreignKey:UserID" json:"user,omitempty"`
    AssignedTo   *AdminUser `gorm:"foreignKey:AssignedToID" json:"assigned_to,omitempty"`
    CallLogs     []CallLog  `gorm:"foreignKey:LeadID" json:"call_logs,omitempty"`
}
```

### 2. CallLog (لاگ تماس)
```go
type CallLog struct {
    ID          uint      `gorm:"primaryKey" json:"id"`
    LeadID      uint      `gorm:"index;not null" json:"lead_id"`
    AdminUserID uint      `gorm:"index;not null" json:"admin_user_id"` // کسی که تماس گرفته
    CallType    string    `gorm:"type:varchar(20);not null" json:"call_type"` // outgoing, incoming
    Duration    int       `gorm:"default:0" json:"duration"` // مدت تماس به ثانیه
    Outcome     string    `gorm:"type:varchar(50)" json:"outcome"` // answered, no_answer, busy, interested, not_interested
    Notes       string    `gorm:"type:text" json:"notes"`
    CalledAt    time.Time `gorm:"index" json:"called_at"`
    CreatedAt   time.Time `json:"created_at"`
    
    // Relations
    Lead      Lead      `gorm:"foreignKey:LeadID" json:"lead,omitempty"`
    AdminUser AdminUser `gorm:"foreignKey:AdminUserID" json:"admin_user,omitempty"`
}
```

### 3. LeadAssignmentRule (قوانین تخصیص خودکار)
```go
type LeadAssignmentRule struct {
    ID          uint      `gorm:"primaryKey" json:"id"`
    Name        string    `gorm:"type:varchar(255);not null" json:"name"`
    IsActive    bool      `gorm:"default:true;index" json:"is_active"`
    Priority    int       `gorm:"default:0" json:"priority"` // اولویت اجرا
    Conditions  string    `gorm:"type:json" json:"conditions"` // شرایط (JSON)
    AssignTo    string    `gorm:"type:varchar(50)" json:"assign_to"` // round_robin, specific_user, team
    TargetIDs   string    `gorm:"type:json" json:"target_ids"` // آرایه ID کاربران یا تیم‌ها
    CreatedAt   time.Time `json:"created_at"`
    UpdatedAt   time.Time `json:"updated_at"`
}
```

## دسترسی‌های جدید (Permissions)

```go
const (
    // Lead Management
    PermissionLeadsView   = "leads.view"
    PermissionLeadsAssign = "leads.assign"
    PermissionLeadsEdit   = "leads.edit"
    PermissionLeadsCall   = "leads.call"
    PermissionLeadsExport = "leads.export"
    
    // Call Logs
    PermissionCallLogsView   = "call_logs.view"
    PermissionCallLogsCreate = "call_logs.create"
    PermissionCallLogsEdit   = "call_logs.edit"
    
    // Lead Reports
    PermissionLeadReportsView = "lead_reports.view"
)
```

## API Endpoints پیشنهادی

### Lead Management
- `GET /admin/leads` - لیست لیدها (با فیلتر و صفحه‌بندی)
- `GET /admin/leads/:id` - جزئیات یک لید
- `POST /admin/leads/:id/assign` - تخصیص لید به فروشنده
- `PUT /admin/leads/:id` - به‌روزرسانی وضعیت و یادداشت‌های لید
- `GET /admin/leads/my-leads` - لیدهای اختصاص داده شده به کاربر فعلی
- `POST /admin/leads/bulk-assign` - تخصیص دسته‌ای لیدها

### Call Logs
- `GET /admin/call-logs` - لیست لاگ‌های تماس
- `POST /admin/call-logs` - ثبت تماس جدید
- `GET /admin/call-logs/lead/:lead_id` - لاگ‌های تماس یک لید
- `GET /admin/call-logs/my-calls` - تماس‌های کاربر فعلی

### Reports
- `GET /admin/reports/lead-performance` - گزارش عملکرد لیدها
- `GET /admin/reports/sales-performance` - گزارش عملکرد فروشندگان
- `GET /admin/reports/conversion-funnel` - قیف تبدیل

## کامپوننت‌های Frontend پیشنهادی

### 1. LeadManagement.tsx
- نمایش لیست لیدها با فیلترهای پیشرفته
- تخصیص لید به فروشندگان
- تغییر وضعیت لید
- افزودن یادداشت

### 2. MyLeads.tsx
- لیست لیدهای اختصاص داده شده به کاربر فعلی
- دکمه سریع برای ثبت تماس
- نمایش آخرین تماس و وضعیت

### 3. CallLogModal.tsx
- فرم ثبت تماس
- انتخاب نتیجه تماس
- افزودن یادداشت

### 4. LeadReports.tsx
- نمودارهای عملکرد
- آمار تبدیل
- مقایسه فروشندگان

## جریان کار (Workflow)

### 1. ایجاد خودکار لید
```
کاربر ثبت‌نام می‌کند
  ↓
سیستم یک Lead جدید ایجاد می‌کند (status: new)
  ↓
قوانین تخصیص خودکار اجرا می‌شوند
  ↓
لید به فروشنده مناسب اختصاص داده می‌شود
```

### 2. تماس با لید
```
فروشنده لیست لیدهای خود را می‌بیند
  ↓
روی لید کلیک می‌کند و اطلاعات کامل را مشاهده می‌کند
  ↓
دکمه "ثبت تماس" را می‌زند
  ↓
فرم ثبت تماس باز می‌شود
  ↓
نتیجه تماس و یادداشت را وارد می‌کند
  ↓
CallLog ذخیره می‌شود و وضعیت لید به‌روزرسانی می‌شود
```

### 3. گزارش‌گیری
```
مدیر وارد بخش گزارشات می‌شود
  ↓
نمودارهای عملکرد فروشندگان را مشاهده می‌کند
  ↓
می‌تواند بر اساس بازه زمانی، فروشنده، یا وضعیت فیلتر کند
  ↓
خروجی Excel از داده‌ها می‌گیرد
```

## ویژگی‌های پیشرفته (مرحله بعدی)

1. **تخصیص خودکار هوشمند**
   - بر اساس بار کاری فروشنده
   - بر اساس تخصص فروشنده
   - بر اساس منطقه جغرافیایی

2. **یادآوری‌های خودکار**
   - اگر لیدی بیش از X روز تماس نگرفته شود، یادآوری ارسال شود
   - یادآوری برای پیگیری‌های برنامه‌ریزی شده

3. **امتیازدهی لید (Lead Scoring)**
   - بر اساس فعالیت کاربر (تماشای ویدیو، کلیک، و غیره)
   - لیدهای با امتیاز بالاتر اولویت بیشتری دارند

4. **یکپارچه‌سازی با CRM**
   - اتصال به سیستم‌های CRM خارجی
   - همگام‌سازی دو طرفه

## نکات پیاده‌سازی

1. **دسترسی‌ها**: 
   - فروشندگان فقط لیدهای خودشان را ببینند
   - مدیران همه لیدها را ببینند و بتوانند تخصیص دهند

2. **عملکرد**:
   - از index برای فیلدهای پرجستجو استفاده شود
   - برای لیست‌های بزرگ از pagination استفاده شود

3. **امنیت**:
   - اطمینان از اینکه فروشندگان فقط به لیدهای خودشان دسترسی دارند
   - لاگ تمام تغییرات مهم

4. **رابط کاربری**:
   - طراحی ساده و سریع برای ثبت تماس
   - نمایش اطلاعات مهم در یک نگاه
   - استفاده از رنگ‌بندی برای وضعیت‌های مختلف

## مثال کد

### Controller برای تخصیص لید
```go
func (ctrl *LeadController) AssignLead(c *gin.Context) {
    leadID := c.Param("id")
    
    var req struct {
        AdminUserID uint   `json:"admin_user_id" binding:"required"`
        Notes       string `json:"notes"`
    }
    
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    // Check permission
    if !HasPermission(c, ctrl.DB, "leads.assign") {
        c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
        return
    }
    
    var lead models.Lead
    if err := ctrl.DB.First(&lead, leadID).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Lead not found"})
        return
    }
    
    lead.AssignedToID = &req.AdminUserID
    if req.Notes != "" {
        lead.Notes = req.Notes
    }
    
    if err := ctrl.DB.Save(&lead).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to assign lead"})
        return
    }
    
    c.JSON(http.StatusOK, gin.H{"lead": lead})
}
```

### Component برای ثبت تماس
```typescript
const CallLogModal: React.FC<{lead: Lead; onClose: () => void}> = ({lead, onClose}) => {
  const [outcome, setOutcome] = useState("");
  const [notes, setNotes] = useState("");
  const [duration, setDuration] = useState(0);
  
  const handleSubmit = async () => {
    const response = await fetch(`${API_URL}/admin/call-logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        lead_id: lead.id,
        outcome,
        notes,
        duration,
        called_at: new Date().toISOString(),
      }),
    });
    
    if (response.ok) {
      alert("✅ تماس با موفقیت ثبت شد");
      onClose();
    }
  };
  
  return (
    <Modal>
      <h2>ثبت تماس با {lead.user.first_name} {lead.user.last_name}</h2>
      <select value={outcome} onChange={(e) => setOutcome(e.target.value)}>
        <option value="answered">پاسخ داد</option>
        <option value="no_answer">پاسخ نداد</option>
        <option value="busy">مشغول</option>
        <option value="interested">علاقه‌مند</option>
        <option value="not_interested">علاقه‌مند نیست</option>
      </select>
      <textarea 
        value={notes} 
        onChange={(e) => setNotes(e.target.value)}
        placeholder="یادداشت‌های تماس..."
      />
      <input 
        type="number" 
        value={duration} 
        onChange={(e) => setDuration(parseInt(e.target.value))}
        placeholder="مدت تماس (ثانیه)"
      />
      <button onClick={handleSubmit}>ثبت تماس</button>
    </Modal>
  );
};
```

## نتیجه‌گیری

این معماری یک پایه قوی برای سیستم مدیریت لید فراهم می‌کند که:
- قابل گسترش است
- امنیت را تضمین می‌کند
- عملکرد خوبی دارد
- تجربه کاربری مناسبی ارائه می‌دهد

با این ساختار، می‌توانید به راحتی ویژگی‌های جدید اضافه کنید و سیستم را با نیازهای خود تطبیق دهید.

