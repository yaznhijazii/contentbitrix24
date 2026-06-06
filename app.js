console.log("=== BITRIX GENERATOR APP VERSION 5.0 LOADED (SUPABASE REALTIME) ===");

/* ═══════════════════════════════════════════════════════
   CONFIG
═══════════════════════════════════════════════════════ */
const WEBHOOK     = 'https://spa.joacademy.com/rest/177813/9c0dqm07ydgf25uv/';
const ENTITY_TYPE = 1440;
const LS_ROWS_KEY = 'btx_saved_rows';
const LS_CC_KEY   = 'btx_cc';
const LS_RECENT   = 'btx_recent_ids';
const LS_SCHED_KEY = 'btx_sync_schedule';

// Supabase Configuration
const SUPABASE_URL = 'https://kgxfvgcidmsfbqeygbzh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtneGZ2Z2NpZG1zZmJxZXlnYnpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NzE5NTQsImV4cCI6MjA5NjA0Nzk1NH0.D_ieRtEqEt9x-MVG9ksYRyinxFFQqwEhVoEsQuuHIE4';
const supabaseClient = (typeof window.supabase !== 'undefined') ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

/* ═══════════════════════════════════════════════════════
   FIELD DEFINITIONS
═══════════════════════════════════════════════════════ */
const FIELDS = {
  subject:  { id: 'ufCrm160_1753097067673', label: 'Subject',   required: true  },
  grade:    { id: 'ufCrm160_1758428558312', label: 'Grade',     required: true  },
  semester: { id: 'ufCrm160_1758428597597', label: 'Semester',  required: true  },
  unit:     { id: 'ufCrm160_1772448761296', label: 'Unit',      required: false },
  lesson:   { id: 'ufCrm160_1772448754224', label: 'Lesson',    required: false },
  domain:   { id: 'ufCrm160_1753097131073', label: 'Domain',    required: false },
  topic:    { id: 'ufCrm160_1753097139961', label: 'Topic',     required: false },
  outcome:  { id: 'ufCrm160_1753097183198', label: 'Outcome',   required: false },
  skill:    { id: 'ufCrm160_1753097189922', label: 'Skill',     required: false },
  itemType: { id: 'ufCrm160_1753614725454', label: 'Item Type', required: false },
};

/* ═══════════════════════════════════════════════════════
   ASSIGNEE MAP  (Bitrix24 user IDs per subject / unit keyword)
   Fields set: assignedById  +  ufCrm160_1755078076
═══════════════════════════════════════════════════════ */
const ASSIGNEE_MAP = {
  // Direct match by subject name (lowercase)
  bySubject: {
    'math':         163546, // Ibrahim
    'biology':      163545, // Ranya
    'earth science': 21921, // Mouth
    'physics':      193663, // Zaatareh
    'chemistry':    192276, // Minwer
  },
  // Fallback: scan unit text for Arabic sub-subject keywords (used when subject = "Science")
  byUnitKeyword: [
    { pattern: /أحياء/,              id: 163545 }, // Ranya   – Biology
    { pattern: /علوم\s*أرض|أرض/,    id: 21921  }, // Mouth   – Earth Science
    { pattern: /فيزياء/,             id: 193663 }, // Zaatareh – Physics
    { pattern: /كيمياء/,             id: 192276 }, // Minwer  – Chemistry
  ],
};

/* ═══════════════════════════════════════════════════════
   STATIC ENUMS (hardcoded — numeric IDs required by Bitrix24)
═══════════════════════════════════════════════════════ */
const STATIC_ENUMS = {
  subject: [
    { id: 12750, text: 'Math' },
    { id: 12752, text: 'English' },
    { id: 12753, text: 'Arabic' },
    { id: 12959, text: 'Chemistry' },
    { id: 12960, text: 'Biology' },
    { id: 12961, text: 'Physics' },
    { id: 13049, text: 'Earth Science' },
    { id: 15834, text: 'Science' },
  ],
  grade: [
    { id: 13035, text: '1' }, { id: 13036, text: '2' }, { id: 13037, text: '3' },
    { id: 13038, text: '4' }, { id: 13039, text: '5' }, { id: 13040, text: '6' },
    { id: 13041, text: '7' }, { id: 13042, text: '8' }, { id: 13043, text: '9' },
    { id: 13044, text: '10' }, { id: 13045, text: '11' }, { id: 13046, text: '12' },
    { id: 14779, text: '13' },
  ],
  semester: [
    { id: 13047, text: 'S1' },
    { id: 13048, text: 'S2' },
  ],
  itemType: [
    { id: 12864, text: 'Recall' },
    { id: 12865, text: 'Introduction - Video' },
    { id: 12866, text: 'Introduction - Presentation' },
    { id: 12867, text: 'Information - Video' },
    { id: 12868, text: 'Information - Presentation' },
    { id: 12869, text: 'Implementation - Situation' },
    { id: 12870, text: 'Implementation - Drill and practice' },
    { id: 12871, text: 'Integration' },
    { id: 12872, text: 'Evaluation' },
  ],
};

const GRADE_ALIASES = {
  'grade 1':13035,'grade 2':13036,'grade 3':13037,'grade 4':13038,'grade 5':13039,
  'grade 6':13040,'grade 7':13041,'grade 8':13042,'grade 9':13043,'grade 10':13044,
  'grade 11':13045,'grade 12':13046,'grade 13':14779,
};
const SEMESTER_ALIASES = {
  'semester 1':13047,'semester 2':13048,'first semester':13047,'second semester':13048,
  'الفصل الأول':13047,'الفصل الثاني':13048,'s 1':13047,'s 2':13048,
};

/* Auto-detect column aliases */
const ALIASES = {
  subject:  ['subject','subjects','مادة','المادة'],
  grade:    ['grade','grades','صف','الصف','grade level','level'],
  semester: ['semester','semesters','فصل','الفصل','term'],
  unit:     ['unit','units','وحدة','الوحدة','chapter'],
  lesson:   ['lesson','lessons','درس','الدرس'],
  domain:   ['domain','domains','مجال','المجال'],
  topic:    ['topic','topics','موضوع','الموضوع'],
  outcome:  ['outcome','outcomes','نتاج','النتاج'],
  skill:    ['skill','skills','مهارة','المهارة'],
  itemType: ['item type','item_type','itemtype','type','نوع'],
};

/* ═══════════════════════════════════════════════════════
   BITRIX API CLIENT
═══════════════════════════════════════════════════════ */
class BitrixAPI {
  constructor(url) { this.base = url.endsWith('/') ? url : url + '/'; }

  async call(method, params = {}, timeoutMs = 8000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(`${this.base}${method}.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        signal: controller.signal
      });
      clearTimeout(id);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error_description || json.error);
      return json;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  }

  async test()                  { return this.call('app.info'); }
  async getFields(eid)          { return this.call('crm.userfield.list', { filter: { ENTITY_ID: eid } }); }
  async getItems(start, select) { 
    return this.call('crm.item.list', { 
      entityTypeId: ENTITY_TYPE, 
      select, 
      start, 
      order: { id: 'DESC' },
      filter: {
        [`!=${FIELDS.unit.id}`]: ''
      }
    }); 
  }
  async createItem(fields)      { return this.call('crm.item.add', { entityTypeId: ENTITY_TYPE, fields }); }
}

/* ═══════════════════════════════════════════════════════
   DATA MANAGER
═══════════════════════════════════════════════════════ */
class DataManager {
  constructor(api) {
    this.api = api;
    this.toId  = {};
    this.toTxt = {};
    this.tree  = {};
    this.hasTree  = false;
    this.itemCount = 0;
  }

  async load(onStep, forceRefresh = false) {
    this._loadStatics();
    
    // 1. Try loading from Supabase first if not forceRefreshing from Bitrix24
    if (!forceRefresh) {
      onStep('fields', 'loading');
      
      // Load static enums and check if cached mappings exist
      const cached = this.loadCache();
      if (cached) {
        onStep('fields', 'done');
        onStep('items', 'loading');
        const loadResult = await this.loadFromSupabase();
        if (loadResult === 'loaded') {
          onStep('items', 'done');
          onStep('hier', 'done');
          return;
        } else if (loadResult === 'empty') {
          this.tree = {};
          this.hasTree = false;
          this.itemCount = 0;
          this.saveCache();
          onStep('items', 'done');
          onStep('hier', 'done');
          return;
        }
      } else {
        // Only fetch api enums from Bitrix24 if no local cache exists
        await this._fetchApiEnums();
        onStep('fields', 'done');
      }
      
      onStep('items', 'loading');
      const loadResult = await this.loadFromSupabase();
      if (loadResult === 'loaded') {
        onStep('items', 'done');
        onStep('hier', 'done');
        this.saveCache(); // backup to localStorage
        return;
      } else if (loadResult === 'empty') {
        this.tree = {};
        this.hasTree = false;
        this.itemCount = 0;
        this.saveCache();
        onStep('items', 'done');
        onStep('hier', 'done');
        return;
      }
      
      // Fallback to local storage cache if Supabase fails (e.g. offline)
      if (this.loadCache()) {
        onStep('items', 'done');
        onStep('hier', 'done');
        return;
      }
    }

    // 2. Fetch fresh from Bitrix24 if forceRefresh is true or if Supabase and local cache are both empty
    this.toId  = {};
    this.toTxt = {};
    this.tree  = {};
    this.hasTree  = false;
    this.itemCount = 0;
    this._loadStatics();

    onStep('fields', 'loading');
    await this._fetchApiEnums();
    onStep('fields', 'done');
    
    onStep('items', 'loading');
    await this._fetchItems();
    onStep('items', 'done');
    
    onStep('hier', 'loading');
    this.hasTree = Object.keys(this.tree).length > 0;
    this.saveCache();
    
    // Save the freshly synced tree to Supabase for shared use
    if (this.hasTree) {
      await this.saveToSupabase();
    }
    
    onStep('hier', 'done');
  }

  async loadFromSupabase() {
    if (!supabaseClient) return 'failed';
    try {
      console.log('Loading hierarchy from Supabase...');
      const { data, error } = await supabaseClient.from('hierarchy').select('subject, grade, semester, unit, lesson, skill');
      if (error) throw error;
      if (!data || data.length === 0) return 'empty';
      
      // Clear the current tree before populating
      this.tree = {};
      
      for (const row of data) {
        const s = row.subject;
        const g = row.grade;
        const sem = row.semester;
        const u = row.unit;
        const l = row.lesson;
        const sk = row.skill || '';
        
        if (!s) continue;
        if (!this.tree[s]) this.tree[s] = {};
        if (g) {
          if (!this.tree[s][g]) this.tree[s][g] = {};
          if (sem) {
            if (!this.tree[s][g][sem]) this.tree[s][g][sem] = {};
            if (u) {
              if (!this.tree[s][g][sem][u]) this.tree[s][g][sem][u] = {};
              if (l) {
                if (!this.tree[s][g][sem][u][l]) this.tree[s][g][sem][u][l] = new Set();
                if (sk) this.tree[s][g][sem][u][l].add(sk);
              }
            }
          }
        }
      }
      this.hasTree = Object.keys(this.tree).length > 0;
      this.itemCount = data.length;
      console.log(`Successfully loaded ${data.length} hierarchy entries from Supabase.`);
      return 'loaded';
    } catch (e) {
      console.warn('Failed to load hierarchy from Supabase:', e.message);
      return 'failed';
    }
  }

  async saveToSupabase() {
    if (!supabaseClient) return;
    try {
      console.log('Upserting hierarchy to Supabase...');
      const rows = [];
      for (const [s, grades] of Object.entries(this.tree)) {
        for (const [g, semesters] of Object.entries(grades)) {
          for (const [sem, units] of Object.entries(semesters)) {
            for (const [u, lessonsMap] of Object.entries(units)) {
              if (lessonsMap && typeof lessonsMap === 'object') {
                for (const [l, skillsSet] of Object.entries(lessonsMap)) {
                  if (skillsSet instanceof Set && skillsSet.size > 0) {
                    for (const sk of skillsSet) {
                      rows.push({ subject: s, grade: g, semester: sem, unit: u, lesson: l, skill: sk });
                    }
                  } else {
                    rows.push({ subject: s, grade: g, semester: sem, unit: u, lesson: l, skill: '' });
                  }
                }
              }
            }
          }
        }
      }
      if (rows.length === 0) return;

      // Upsert rows in chunks to prevent payload size issues
      const chunkSize = 150;
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const { error } = await supabaseClient.from('hierarchy').upsert(chunk, { onConflict: 'subject,grade,semester,unit,lesson,skill' });
        if (error) console.error('Error upserting chunk to Supabase:', error);
      }
      console.log(`Saved ${rows.length} hierarchy records to Supabase`);
    } catch (e) {
      console.warn('Failed to save hierarchy to Supabase:', e.message);
    }
  }

  async addCustomToSupabase(s, g, sem, u, l, sk) {
    if (!supabaseClient) return;
    try {
      const { error } = await supabaseClient.from('hierarchy').upsert({
        subject: s,
        grade: g,
        semester: sem,
        unit: u || '',
        lesson: l || '',
        skill: sk || ''
      }, { onConflict: 'subject,grade,semester,unit,lesson,skill' });
      if (error) throw error;
      console.log(`Successfully added custom entry to Supabase: ${s} / ${g} / ${sem} / ${u} / ${l} / ${sk}`);
    } catch (e) {
      console.error('Failed to add custom hierarchy entry to Supabase:', e.message);
    }
  }

  _loadStatics() {
    for (const [key, entries] of Object.entries(STATIC_ENUMS)) {
      this.toId[key]  = new Map();
      this.toTxt[key] = new Map();
      for (const { id, text } of entries) {
        this.toId[key].set(text.toLowerCase().trim(), id);
        this.toTxt[key].set(String(id), text);
      }
    }
    for (const [a, id] of Object.entries(GRADE_ALIASES))    this.toId.grade.set(a.toLowerCase(), id);
    for (const [a, id] of Object.entries(SEMESTER_ALIASES)) this.toId.semester.set(a.toLowerCase(), id);
  }

  async _fetchApiEnums() {
    for (const eid of [`CRM_${ENTITY_TYPE}`, `DYNAMIC_${ENTITY_TYPE}`]) {
      try {
        const d = await this.api.getFields(eid);
        const apiFields = d.result || [];
        if (!apiFields.length) continue;
        for (const f of apiFields) {
          const key = Object.entries(FIELDS).find(([,v]) => v.id === f.FIELD_NAME)?.[0];
          if (!key) continue;
          if (!['subject', 'grade', 'semester', 'itemType'].includes(key)) continue;
          const items = f.ITEMS || f.LIST || [];
          if (!this.toId[key]) this.toId[key] = new Map();
          if (!this.toTxt[key]) this.toTxt[key] = new Map();
          for (const item of items) {
            const id = parseInt(item.ID || item.id || 0);
            const val = String(item.VALUE || item.value || '').trim();
            if (!id || !val || this.toId[key].has(val.toLowerCase())) continue;
            this.toId[key].set(val.toLowerCase(), id);
            this.toTxt[key].set(String(id), val);
          }
        }
        break;
      } catch { /* ignore */ }
    }
  }

  async _fetchItems() {
    const select = ['id', ...Object.values(FIELDS).map(f => f.id)];
    let start = 0;
    try {
      while (this.itemCount < 500) {
        const data  = await this.api.getItems(start, select);
        const items = data.result?.items || data.result || [];
        if (!Array.isArray(items) || !items.length) break;
        for (const item of items) this._addToTree(item);
        this.itemCount += items.length;
        if (!data.next) break;
        start = data.next;
      }
    } catch (e) { console.warn('Hierarchy fetch failed:', e.message); }
  }

  _addToTree(item) {
    const txt = key => {
      const raw = item[FIELDS[key]?.id];
      if (!raw) return null;
      const rawStr = Array.isArray(raw) ? String(raw[0]) : String(raw);
      if (['subject', 'grade', 'semester', 'itemType'].includes(key) && this.toTxt[key] && this.toTxt[key].size > 0) {
        return this.toTxt[key].get(rawStr) || null;
      }
      return rawStr;
    };
    const s = txt('subject'), g = txt('grade'), sem = txt('semester'), u = txt('unit'), l = txt('lesson'), sk = txt('skill');
    if (!s) return;
    if (!this.tree[s])               this.tree[s] = {};
    if (g) {
      if (!this.tree[s][g])           this.tree[s][g] = {};
      if (sem) {
        if (!this.tree[s][g][sem])    this.tree[s][g][sem] = {};
        if (u) {
          if (!this.tree[s][g][sem][u]) this.tree[s][g][sem][u] = {};
          if (l) {
            if (!this.tree[s][g][sem][u][l]) this.tree[s][g][sem][u][l] = new Set();
            if (sk) this.tree[s][g][sem][u][l].add(sk);
          }
        }
      }
    }
  }

  saveCache() {
    try {
      const data = {
        toId: {},
        toTxt: {},
        tree: this._serializeTree(this.tree),
        itemCount: this.itemCount,
        hasTree: this.hasTree,
        timestamp: Date.now()
      };
      for (const [key, map] of Object.entries(this.toId)) {
        if (map instanceof Map) {
          data.toId[key] = Array.from(map.entries());
        }
      }
      for (const [key, map] of Object.entries(this.toTxt)) {
        if (map instanceof Map) {
          data.toTxt[key] = Array.from(map.entries());
        }
      }
      localStorage.setItem('btx_cache_data_v3', JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save cache:', e);
    }
  }

  loadCache() {
    try {
      const cached = localStorage.getItem('btx_cache_data_v3');
      if (!cached) return false;
      const data = JSON.parse(cached);
      if (!data || !data.toId || !data.toTxt) return false;
      
      this.itemCount = data.itemCount || 0;
      this.hasTree = data.hasTree || false;
      
      this.toId = {};
      for (const [key, entries] of Object.entries(data.toId)) {
        this.toId[key] = new Map(entries);
      }
      
      this.toTxt = {};
      for (const [key, entries] of Object.entries(data.toTxt)) {
        this.toTxt[key] = new Map(entries);
      }
      
      this.tree = this._deserializeTree(data.tree || {});
      return true;
    } catch (e) {
      console.warn('Failed to load cache:', e);
      return false;
    }
  }

  _serializeTree(node) {
    if (node instanceof Set) {
      return Array.from(node);
    }
    if (typeof node === 'object' && node !== null) {
      const out = {};
      for (const [k, v] of Object.entries(node)) {
        out[k] = this._serializeTree(v);
      }
      return out;
    }
    return node;
  }

  _deserializeTree(node) {
    if (Array.isArray(node)) {
      return new Set(node);
    }
    if (typeof node === 'object' && node !== null) {
      const out = {};
      for (const [k, v] of Object.entries(node)) {
        out[k] = this._deserializeTree(v);
      }
      return out;
    }
    return node;
  }

  resolveId(key, text) {
    if (!text) return null;
    const clean = text.toLowerCase().trim();
    
    // Only resolve for known list fields
    if (!['subject', 'grade', 'semester', 'itemType'].includes(key)) {
      return null;
    }
    
    // Direct lookup
    let res = this.toId[key]?.get(clean);
    if (res !== undefined) return res;
    
    // Smart fallback for grade (e.g. "grad 6", "grade 6", "g6", "g 6" -> "6")
    if (key === 'grade') {
      const match = clean.match(/\b\d+\b/) || clean.match(/\d+/);
      if (match) {
        const num = match[0];
        const numRes = this.toId.grade?.get(num);
        if (numRes !== undefined) return numRes;
      }
    }

    // Smart fallback for semester (e.g. "semester 1", "sem 1", "s1", "s 1" -> "s1")
    if (key === 'semester') {
      const match = clean.match(/\b\d+\b/) || clean.match(/\d+/);
      if (match) {
        const num = match[0];
        const numRes = this.toId.semester?.get(`s${num}`) || this.toId.semester?.get(num);
        if (numRes !== undefined) return numRes;
      }
    }
    
    return null;
  }
  hasEnum(key) { return !!this.toId[key]?.size; }
}

/* ═══════════════════════════════════════════════════════
   VALIDATOR
═══════════════════════════════════════════════════════ */
class Validator {
  constructor(dm) { this.dm = dm; }

  validateRow(row, mapping) {
    const errors = [], warnings = [], ids = {}, values = {};
    const get = key => {
      const idx = mapping[key];
      return idx != null ? String(row[idx] ?? '').trim() : '';
    };

    for (const key of Object.keys(FIELDS)) values[key] = get(key);

    // Autofill skill if lesson has exactly 1 skill and row's skill is currently blank
    if (!values.skill && values.subject && values.grade && values.semester && values.unit && values.lesson && this.dm.hasTree) {
      const skillsSet = this.dm.tree[values.subject]?.[values.grade]?.[values.semester]?.[values.unit]?.[values.lesson];
      if (skillsSet && skillsSet.size === 1) {
        const autofilledSkill = Array.from(skillsSet)[0];
        if (autofilledSkill) {
          values.skill = autofilledSkill;
        }
      }
    }

    if (!values.subject)  errors.push('Subject is required');
    if (!values.grade)    errors.push('Grade is required');
    if (!values.semester) errors.push('Semester is required');
    if (errors.length) return { status: 'error', errors, warnings, ids, values };

    const resolve = (key, hard) => {
      const raw = values[key];
      if (!raw) return null;
      const id = this.dm.resolveId(key, raw);
      if (id == null && this.dm.hasEnum(key))
        (hard ? errors : warnings).push(`"${raw}" not found in ${FIELDS[key].label} list`);
      return id;
    };

    ids.subject  = resolve('subject',  true);
    ids.grade    = resolve('grade',    true);
    ids.semester = resolve('semester', true);

    if (this.dm.hasTree) {
      const { subject: s, grade: g, semester: sem, unit: u, lesson: l } = values;
      const t = this.dm.tree;
      if (!t[s])                          warnings.push(`No items for Subject "${s}" — hierarchy skipped`);
      else if (g && !t[s][g])             warnings.push(`Grade "${g}" not found under "${s}"`);
      else if (g && sem && !t[s][g]?.[sem]) warnings.push(`Semester "${sem}" not found under ${s}/${g}`);
      else if (g && sem && u) {
        if (!t[s][g]?.[sem]?.[u])          warnings.push(`Unit "${u}" (new, will be imported)`);
        else if (l && !t[s][g][sem][u][l])
          warnings.push(`Lesson "${l}" (new, will be imported)`);
      }
    }

    for (const key of ['unit','lesson','domain','topic','outcome','skill','itemType'])
      ids[key] = resolve(key, false);

    const status = errors.length ? 'error' : warnings.length ? 'warn' : 'valid';
    return { status, errors, warnings, ids, values };
  }

  validateAll(rows, mapping) {
    return rows.map((row, i) => ({ rowNum: i + 2, ...this.validateRow(row, mapping) }));
  }
}

/* ═══════════════════════════════════════════════════════
   EXCEL HANDLER
═══════════════════════════════════════════════════════ */
const ExcelHandler = {
  parse(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const wb    = XLSX.read(e.target.result, { type: 'array' });
          const sheet = wb.Sheets[wb.SheetNames[0]];
          const data  = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
          if (data.length < 2) { reject(new Error('File is empty')); return; }
          const headers = data[0].map(h => String(h).trim());
          const rows    = data.slice(1).filter(r => r.some(c => c !== '' && c != null));
          resolve({ headers, rows });
        } catch (err) { reject(err); }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  },

  exportErrors(rows) {
    const cols = ['Row #','Subject','Grade','Semester','Unit','Lesson','Domain','Topic','Outcome','Skill','Item Type','Error'];
    const data = rows.map(r => [
      r.rowNum,
      r.values?.subject||'', r.values?.grade||'', r.values?.semester||'',
      r.values?.unit||'',    r.values?.lesson||'', r.values?.domain||'',
      r.values?.topic||'',   r.values?.outcome||'', r.values?.skill||'',
      r.values?.itemType||'',
      [...(r.errors||[]),(r.warnings||[])].join('; '),
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([cols,...data]), 'Errors');
    XLSX.writeFile(wb, 'failed_rows.xlsx');
  },

  exportReport(results) {
    const cols = ['Row #','Status','Subject','Grade','Semester','Unit','Lesson','Bitrix ID','Notes'];
    const data = results.map(r => [
      r.rowNum, r.finalStatus||r.status,
      r.values?.subject||'', r.values?.grade||'', r.values?.semester||'',
      r.values?.unit||'',    r.values?.lesson||'', r.createdId||'',
      [...(r.errors||[]),(r.warnings||[])].join('; ')||'OK',
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([cols,...data]), 'Report');
    XLSX.writeFile(wb, 'processing_report.xlsx');
  },
};

/* ═══════════════════════════════════════════════════════
   TICKET CREATOR
═══════════════════════════════════════════════════════ */
class TicketCreator {
  constructor(api) { this.api = api; }

  _buildFields({ ids, values }) {
    const out = {};
    for (const key of Object.keys(FIELDS)) {
      if (['subject', 'grade', 'semester', 'itemType'].includes(key)) {
        const numId = ids?.[key];
        if (numId != null) {
          out[FIELDS[key].id] = numId;
        }
      } else {
        const val = values?.[key];
        if (val !== undefined && val !== null) {
          out[FIELDS[key].id] = String(val).trim();
        }
      }
    }
    // 3-letter abbreviations for each item type
    const ITEM_TYPE_ABBR = {
      'recall':                          'RCL',
      'introduction - video':            'ITV',
      'introduction - presentation':     'ITP',
      'information - video':             'INV',
      'information - presentation':      'INP',
      'implementation - situation':      'IMS',
      'implementation - drill and practice': 'IDP',
      'integration':                     'ITG',
      'evaluation':                      'EVL',
    };
    // Set Bitrix24 item title to: "skill name | ITEM_ABBR"
    const skillVal    = values?.skill     ? String(values.skill).trim()     : '';
    const itemTypeRaw = values?.itemType  ? String(values.itemType).trim()  : '';
    const itemAbbr    = ITEM_TYPE_ABBR[itemTypeRaw.toLowerCase()] || itemTypeRaw.slice(0, 3).toUpperCase() || '';
    const titleParts  = [skillVal, itemAbbr].filter(Boolean);
    if (titleParts.length) {
      out['title'] = titleParts.join(' | ');
    } else {
      // Fallback: build title from subject / grade / semester
      const parts = [values?.subject, values?.grade, values?.semester].filter(Boolean);
      out['title'] = parts.join(' - ') || 'Untitled';
    }
    return out;
  }

  async createAll(items, { concurrency = 5, onProgress } = {}) {
    const results = [];
    let created = 0, failed = 0, processed = 0;
    const total = items.length, t0 = Date.now();

    for (let i = 0; i < items.length; i += concurrency) {
      const chunk   = items.slice(i, i + concurrency);
      const settled = await Promise.allSettled(chunk.map(v => this.api.createItem(this._buildFields(v))));
      for (let j = 0; j < chunk.length; j++) {
        const v = chunk[j], res = settled[j];
        processed++;
        if (res.status === 'fulfilled') {
          const id = res.value.result?.item?.id || res.value.result?.id || null;
          results.push({ ...v, finalStatus: 'created', createdId: id });
          created++;
        } else {
          results.push({ ...v, finalStatus: 'failed', errors: [res.reason?.message || 'Unknown'] });
          failed++;
        }
      }
      const eta = Math.ceil((total - processed) / Math.max((Date.now() - t0) / 1000, 0.1) * (total - processed) / Math.max(processed, 1));
      onProgress?.({ created, failed, processed, total, eta, results });
      if (i + concurrency < items.length) await sleep(220);
    }
    return { results, created, failed };
  }
}

/* ═══════════════════════════════════════════════════════
   UTILITIES
═══════════════════════════════════════════════════════ */
const sleep = ms => new Promise(r => setTimeout(r, ms));
const truncate = (s, n) => s && s.length > n ? s.slice(0, n) + '…' : (s || '—');

function toast(msg, type = 'info', ms = 4000) {
  const zone = document.getElementById('toastZone');
  const el   = document.createElement('div');
  el.className = `toast ${type === 'success' ? 'tok' : type === 'error' ? 'terr' : 'tinf'}`;
  const icons = {
    success: '<svg class="t-ico" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    error:   '<svg class="t-ico" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    info:    '<svg class="t-ico" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
  };
  el.innerHTML = `${icons[type]||icons.info}<span>${msg}</span>`;
  zone.appendChild(el);
  setTimeout(() => { el.style.animation='tOut .3s ease forwards'; setTimeout(()=>el.remove(),310); }, ms);
}

/* ═══════════════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════════════ */
class App {
  constructor() {
    // Set theme from local storage
    const savedTheme = localStorage.getItem('btx_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    this.api = new BitrixAPI(WEBHOOK);
    this.dm  = null;
    this.val = null;
    this.cfg = {
      concurrency: parseInt(localStorage.getItem(LS_CC_KEY) || '5'),
      schedule: parseInt(localStorage.getItem(LS_SCHED_KEY) || '0')
    };

    this.savedRows     = []; 
    this.recentTickets = [];
    this.scheduledTickets = [];
    this.useDBScheduled = false;
    this._schedulingSource = 'single';
    this._selectedRows = new Set();
    this._activeFilter = 'all';
    this._allResults   = [];
    this._runningJobs  = new Set(); // guard against re-entrant scheduler ticks
  }

  /* ═══ BOOT ═══ */
  async init() {
    this._bindAll();
    this._populateSelects();
    this._renderSavedRows();
    
    // Connect to data manager
    await this._autoConnect(false);
    
    // Probe database for scheduled_tickets table
    await this.checkScheduledTicketsTable();

    // Load theme icon state
    const savedTheme = localStorage.getItem('btx_theme') || 'dark';
    this._updateThemeIconDisplay(savedTheme);

    // Initialize Realtime subscription
    if (supabaseClient) {
      supabaseClient.channel('public:recent_tickets')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'recent_tickets' }, payload => {
          this._handleRealtimeRecentTickets(payload);
        })
        .subscribe();

      if (this.useDBScheduled) {
        supabaseClient.channel('public:scheduled_tickets')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'scheduled_tickets' }, payload => {
            this._handleRealtimeScheduled(payload);
          })
          .subscribe();
      }
    }

    // Load rows, recent tickets, and scheduled tickets
    await this._loadSavedRowsFromSupabase();
    await this._loadRecentTicketsFromSupabase();
    await this._loadScheduledTickets();
    
    // Start background execution runner
    this.startScheduler();

    // Bind Supabase Realtime channels
    this.initRealtime();
    this._checkAndRunAutoSync();
  }

  /* ═══ REALTIME CHANNELS ═══ */
  initRealtime() {
    if (!supabaseClient) return;
    
    // Subscribe to hierarchy cache changes
    supabaseClient.channel('public:hierarchy')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'hierarchy' }, payload => {
        console.log('Realtime hierarchy insert:', payload.new);
        const { subject: s, grade: g, semester: sem, unit: u, lesson: l, skill: sk } = payload.new;
        if (!s) return;
        
        if (!this.dm.tree[s]) this.dm.tree[s] = {};
        if (g) {
          if (!this.dm.tree[s][g]) this.dm.tree[s][g] = {};
          if (sem) {
            if (!this.dm.tree[s][g][sem]) this.dm.tree[s][g][sem] = {};
            if (u) {
              if (!this.dm.tree[s][g][sem][u]) this.dm.tree[s][g][sem][u] = {};
              if (l) {
                if (!this.dm.tree[s][g][sem][u][l]) this.dm.tree[s][g][sem][u][l] = new Set();
                if (sk) this.dm.tree[s][g][sem][u][l].add(sk);
              }
            }
          }
        }
        this.dm.hasTree = true;
        this.dm.saveCache();
        
        // Dynamically update dropdown options in case the user has the relevant parent selected
        this._updateUnitDropdown();
      })
      .subscribe();

    // Subscribe to saved rows (bulk uploads) changes
    supabaseClient.channel('public:saved_rows')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'saved_rows' }, payload => {
        console.log('Realtime saved_rows change:', payload);
        this._handleRealtimeSavedRows(payload);
      })
      .subscribe();

    // Subscribe to recently created ticket logs
    supabaseClient.channel('public:recent_tickets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recent_tickets' }, payload => {
        console.log('Realtime recent_tickets change:', payload);
        this._handleRealtimeRecentTickets(payload);
      })
      .subscribe();
  }

  /* ═══ THEME CONTROLS ═══ */
  _updateThemeIconDisplay(theme) {
    const sun = document.querySelector('#themeToggleBtn .sun-ico');
    const moon = document.querySelector('#themeToggleBtn .moon-ico');
    if (sun && moon) {
      if (theme === 'dark') {
        sun.style.display = 'block';
        moon.style.display = 'none';
      } else {
        sun.style.display = 'none';
        moon.style.display = 'block';
      }
    }
  }

  /* ═══ ASSIGNEE RESOLUTION ═══ */
  /**
   * Returns the Bitrix24 user ID of the responsible person for a given subject.
   * For the generic "Science" subject, it falls back to scanning the unit name
   * for Arabic sub-discipline keywords (أحياء / علوم أرض / فيزياء / كيمياء).
   *
   * @param {string} subjectText  – Display text of the subject (e.g. "Math", "Science")
   * @param {string} [unitText]   – Unit / chapter name (used only when subject is "Science")
   * @returns {number|null}       – Bitrix24 user ID or null if no match
   */
  _resolveAssigneeId(subjectText, unitText) {
    const subject = (subjectText || '').toLowerCase().trim();

    // 1. Direct subject → person lookup
    const directId = ASSIGNEE_MAP.bySubject[subject];
    if (directId) return directId;

    // 2. For the umbrella "Science" subject, inspect the unit name for Arabic keywords
    if (subject === 'science') {
      const unit = unitText || '';
      for (const { pattern, id } of ASSIGNEE_MAP.byUnitKeyword) {
        if (pattern.test(unit)) return id;
      }
    }

    return null; // English, Arabic, or unknown subject — leave assignee unset
  }

  /* ═══ SCHEDULING DATABASE & STORAGE CONTROLS ═══ */
  async checkScheduledTicketsTable() {
    if (!supabaseClient) {
      this.useDBScheduled = false;
      return;
    }
    try {
      const { error } = await supabaseClient.from('scheduled_tickets').select('id').limit(1);
      if (error) {
        // Table doesn't exist or is inaccessible — codes vary by PostgREST/Supabase version:
        // 42P01 = undefined_table (PostgreSQL), PGRST200/PGRST116/404 HTTP = relation not found
        const code = String(error.code || '');
        const msg  = String(error.message || '').toLowerCase();
        const isNotFound =
          code === '42P01' ||
          code.startsWith('PGRST') ||
          msg.includes('relation') ||
          msg.includes('does not exist') ||
          msg.includes('not found');
        this.useDBScheduled = !isNotFound;
        if (!this.useDBScheduled) {
          console.warn('[Scheduler] scheduled_tickets table not found — falling back to localStorage.', error.message);
        }
      } else {
        this.useDBScheduled = true;
      }
    } catch (e) {
      this.useDBScheduled = false;
      console.warn('[Scheduler] Could not probe scheduled_tickets table:', e.message);
    }
    console.log('Scheduled tickets database mode active:', this.useDBScheduled);
  }

  async _loadScheduledTickets() {
    try {
      if (this.useDBScheduled && supabaseClient) {
        console.log('Loading scheduled tickets from Supabase...');
        const { data, error } = await supabaseClient.from('scheduled_tickets').select('*').order('scheduled_at', { ascending: true });
        if (error) throw error;
        this.scheduledTickets = data || [];
      } else {
        const cached = localStorage.getItem('btx_scheduled_tickets');
        this.scheduledTickets = cached ? JSON.parse(cached) : [];
      }
      this._renderScheduledTickets();
    } catch (e) {
      console.warn('Failed to load scheduled tickets:', e.message);
    }
  }

  _renderScheduledTickets() {
    const tbody = document.getElementById('scheduledBody');
    const badge = document.getElementById('scheduledBadge');
    if (!tbody) return;

    const pendingCount = this.scheduledTickets.filter(t => t.status === 'pending').length;
    if (badge) {
      if (pendingCount > 0) {
        badge.textContent = String(pendingCount);
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    }

    const term = document.getElementById('scheduledSearch')?.value.toLowerCase().trim();
    const filtered = this.scheduledTickets.filter(t => {
      if (!term) return true;
      const matchStr = `${t.subject} ${t.grade} ${t.semester} ${t.unit || ''} ${t.lesson || ''} ${t.status}`.toLowerCase();
      return matchStr.includes(term);
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--t3);padding:24px;">No scheduled tickets found.</td></tr>`;
      return;
    }

    tbody.innerHTML = '';
    filtered.forEach((t, index) => {
      const tr = document.createElement('tr');
      tr.className = `r-${t.status}`;
      
      let statusClass = 'sb-ok';
      if (t.status === 'pending') statusClass = 'sb-wrn';
      else if (t.status === 'processing') statusClass = 'sb-ok';
      else if (t.status === 'failed') statusClass = 'sb-err';
      else if (t.status === 'completed') statusClass = 'sb-ok';

      const formatTime = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleString();
      };

      const itemTypesText = (t.item_types || []).map(it => it.text).join(', ') || '—';
      
      let detailsHtml = '—';
      if (t.status === 'completed' && t.notes) {
        try {
          const links = JSON.parse(t.notes);
          detailsHtml = links.map(link => 
            `<a href="https://spa.joacademy.com/page/content/ula_content_development/type/1440/details/${link.id}/" target="_blank" class="id-chip" style="text-decoration:none; margin-right:6px;">#${link.id}</a>`
          ).join('');
        } catch (e) {
          detailsHtml = truncate(t.notes, 30);
        }
      } else if (t.status === 'failed') {
        detailsHtml = `<span style="color:var(--err); font-weight:600;">${t.notes || 'Unknown error'}</span>`;
      } else if (t.status === 'processing') {
        detailsHtml = '<span style="color:var(--cyan); font-weight:600;"><div class="btn-spinner" style="border-color:var(--cyan);border-top-color:transparent;width:10px;height:10px;margin-right:6px;vertical-align:middle;"></div>Creating…</span>';
      }

      tr.innerHTML = `
        <td class="td-num">${index + 1}</td>
        <td>${formatTime(t.scheduled_at)}</td>
        <td><strong>${t.subject}</strong> · Grade ${t.grade} · ${t.semester}<br><span style="font-size:11px;color:var(--t3);">${t.unit || '—'} / ${t.lesson || '—'}</span></td>
        <td style="font-size:12px;">${itemTypesText}</td>
        <td><span class="sbadge ${statusClass}">${t.status}</span></td>
        <td class="td-msg" title="${t.notes || ''}">${detailsHtml}</td>
        <td style="text-align: center;">
          ${t.status === 'pending' ? `
            <button class="sel-btn btn-run-now" style="padding:4px 8px; font-size:11px; margin-right:4px;">Run Now</button>
            <button class="sel-btn btn-delete-sched sel-btn-clear" style="padding:4px 8px; font-size:11px;">Cancel</button>
          ` : `
            <button class="sel-btn btn-delete-sched sel-btn-clear" style="padding:4px 8px; font-size:11px;">Delete</button>
          `}
        </td>
      `;

      const runBtn = tr.querySelector('.btn-run-now');
      if (runBtn) {
        runBtn.addEventListener('click', () => this.runScheduledJobImmediately(t.id || t.temp_id));
      }

      tr.querySelector('.btn-delete-sched').addEventListener('click', () => this.deleteScheduledJob(t.id || t.temp_id));

      tbody.appendChild(tr);
    });
  }

  async deleteScheduledJob(id) {
    if (!confirm('Are you sure you want to cancel/delete this scheduled job?')) return;
    try {
      if (this.useDBScheduled && supabaseClient) {
        const { error } = await supabaseClient.from('scheduled_tickets').delete().eq('id', id);
        if (error) throw error;
      } else {
        const cached = localStorage.getItem('btx_scheduled_tickets');
        let jobs = cached ? JSON.parse(cached) : [];
        jobs = jobs.filter(j => (j.id || j.temp_id) !== id);
        localStorage.setItem('btx_scheduled_tickets', JSON.stringify(jobs));
        this.scheduledTickets = jobs;
        this._renderScheduledTickets();
      }
      toast('Scheduled job removed', 'info');
      await this._loadScheduledTickets();
    } catch (e) {
      console.error('Failed to delete scheduled job:', e.message);
      toast(`Error: ${e.message}`, 'error');
    }
  }

  async clearAllScheduledJobs() {
    if (!confirm('Are you sure you want to cancel ALL scheduled jobs?')) return;
    try {
      if (this.useDBScheduled && supabaseClient) {
        const { error } = await supabaseClient.from('scheduled_tickets').delete().neq('id', 0);
        if (error) throw error;
      } else {
        localStorage.removeItem('btx_scheduled_tickets');
        this.scheduledTickets = [];
        this._renderScheduledTickets();
      }
      toast('All scheduled jobs cancelled', 'info');
      await this._loadScheduledTickets();
    } catch (e) {
      console.error('Failed to clear scheduled jobs:', e.message);
      toast(`Error: ${e.message}`, 'error');
    }
  }

  async runScheduledJobImmediately(id) {
    const job = this.scheduledTickets.find(j => (j.id || j.temp_id) === id);
    if (!job || job.status !== 'pending') return;
    toast('Executing scheduled ticket now…', 'info');
    
    let canProceed = false;
    if (this.useDBScheduled && supabaseClient) {
      try {
        const { data, error } = await supabaseClient.from('scheduled_tickets')
          .update({ status: 'processing' })
          .eq('id', id)
          .eq('status', 'pending')
          .select();
        if (!error && data && data.length > 0) {
          canProceed = true;
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      job.status = 'processing';
      localStorage.setItem('btx_scheduled_tickets', JSON.stringify(this.scheduledTickets));
      this._renderScheduledTickets();
      canProceed = true;
    }

    if (canProceed) {
      this.executeScheduledJob(job);
    }
  }

  async executeScheduledJob(job) {
    const idKey = job.id || job.temp_id;
    try {
      console.log('Background Executing scheduled job:', job);
      
      const resolveVal = (key, text) => {
        if (!text) return null;
        return this.dm.resolveId(key, text);
      };

      const subjectId  = resolveVal('subject', job.subject);
      const gradeId    = resolveVal('grade', job.grade);
      const semesterId = resolveVal('semester', job.semester);
      
      if (!subjectId || !gradeId || !semesterId) {
        throw new Error(`Taxonomy values unresolved for Bitrix24: Subject "${job.subject}" -> ${subjectId}, Grade "${job.grade}" -> ${gradeId}, Semester "${job.semester}" -> ${semesterId}`);
      }

      const creator = new TicketCreator(this.api);
      const typesToCreate = (job.item_types && job.item_types.length > 0) ? job.item_types : [{ id: null, text: '' }];
      const createdTickets = [];

      for (let index = 0; index < typesToCreate.length; index++) {
        const itemTypeObj = typesToCreate[index];
        
        const ids = {
          subject:  subjectId,
          grade:    gradeId,
          semester: semesterId,
          itemType: itemTypeObj.id,
          unit:     resolveVal('unit', job.unit),
          lesson:   resolveVal('lesson', job.lesson),
          domain:   resolveVal('domain', job.domain),
          topic:    resolveVal('topic', job.topic),
          outcome:  resolveVal('outcome', job.outcome),
          skill:    resolveVal('skill', job.skill),
        };

        const payload = creator._buildFields({ ids, values: { ...job, itemType: itemTypeObj.text || '' } });

        // Auto-assign responsible person based on subject (and unit name for Science)
        const assigneeId = this._resolveAssigneeId(job.subject, job.unit);
        if (assigneeId) {
          payload['assignedById']        = assigneeId;
          payload['ufCrm160_1755078076'] = assigneeId;
        }

        console.log(`[SCHEDULED ENGINE] Submitting Bitrix24 payload:`, JSON.stringify(payload, null, 2));

        const res = await this.api.createItem(payload);
        const ticketId = res.result?.item?.id || res.result?.id || null;

        let displayId = ticketId;

        if (ticketId) {
          const numericId = parseInt(ticketId);
          console.log(`[SCHEDULED ENGINE] Workaround: Waiting 1.5s for cloning...`);
          await sleep(1500);

          const searchTitle = `ULA Content Development #${numericId}`;
          let targetId = numericId;

          try {
            const searchRes = await this.api.call('crm.item.list', {
              entityTypeId: ENTITY_TYPE,
              filter: { "title": searchTitle }
            });
            const items = searchRes.result?.items || searchRes.result || [];
            if (items.length > 0) {
              targetId = parseInt(items[0].id);
            } else {
              targetId = numericId + 1;
            }
          } catch (searchErr) {
            targetId = numericId + 1;
          }

          console.log(`[SCHEDULED ENGINE] Updating cloned ticket #${targetId}...`);
          const updatePayload = {
            [FIELDS.unit.id]: job.unit,
            [FIELDS.lesson.id]: job.lesson,
            [FIELDS.domain.id]: job.domain,
            [FIELDS.topic.id]: job.topic,
            [FIELDS.outcome.id]: job.outcome,
            [FIELDS.skill.id]: job.skill
          };

          try {
            await this.api.call('crm.item.update', {
              entityTypeId: ENTITY_TYPE,
              id: targetId,
              fields: updatePayload
            });
            displayId = targetId;
          } catch (updateErr) {
            try {
              await this.api.call('crm.item.update', {
                entityTypeId: ENTITY_TYPE,
                id: numericId,
                fields: updatePayload
              });
            } catch (origErr) {
              console.error('Update failed for both target and original.');
            }
          }

          const displayIdStr = String(displayId);
          createdTickets.push({ id: displayIdStr, typeText: itemTypeObj.text || '' });

          this._addRecentId(displayIdStr);
          this._addRecentTicketToSupabase(displayIdStr, job.subject, job.grade, job.semester);
        }
      }

      if (createdTickets.length > 0) {
        const notesVal = JSON.stringify(createdTickets);
        if (this.useDBScheduled && supabaseClient) {
          await supabaseClient.from('scheduled_tickets')
            .update({ status: 'completed', notes: notesVal })
            .eq('id', idKey);
        } else {
          const jobRef = this.scheduledTickets.find(j => (j.id || j.temp_id) === idKey);
          if (jobRef) {
            jobRef.status = 'completed';
            jobRef.notes = notesVal;
          }
          localStorage.setItem('btx_scheduled_tickets', JSON.stringify(this.scheduledTickets));
        }
        
        const ticketLinks = createdTickets.map(t => `#${t.id}`).join(', ');
        toast(`[Scheduled] Successfully created ticket(s): ${ticketLinks}!`, 'success', 6000);
      } else {
        throw new Error('No tickets created.');
      }

    } catch (e) {
      console.error('[SCHEDULED ENGINE] Job execution failed:', e.message);
      if (this.useDBScheduled && supabaseClient) {
        await supabaseClient.from('scheduled_tickets')
          .update({ status: 'failed', notes: e.message })
          .eq('id', idKey);
      } else {
        const jobRef = this.scheduledTickets.find(j => (j.id || j.temp_id) === idKey);
        if (jobRef) {
          jobRef.status = 'failed';
          jobRef.notes = e.message;
        }
        localStorage.setItem('btx_scheduled_tickets', JSON.stringify(this.scheduledTickets));
      }
      toast(`[Scheduled] Ticket creation failed: ${e.message}`, 'error', 6000);
    } finally {
      await this._loadScheduledTickets();
    }
  }

  startScheduler() {
    console.log('Background Scheduled Ticket Runner started.');
    setInterval(async () => {
      const now = new Date();
      const dueJobs = this.scheduledTickets.filter(
        j => j.status === 'pending' && new Date(j.scheduled_at) <= now
      );

      for (const job of dueJobs) {
        const idKey = job.id || job.temp_id;

        // Re-entrancy guard: skip if this job is already running in this tab
        if (this._runningJobs.has(idKey)) continue;

        let canProceed = false;

        if (this.useDBScheduled && supabaseClient) {
          try {
            const { data, error } = await supabaseClient.from('scheduled_tickets')
              .update({ status: 'processing' })
              .eq('id', idKey)
              .eq('status', 'pending')
              .select();
            if (!error && data && data.length > 0) {
              canProceed = true;
            }
          } catch (err) {
            console.error('[Scheduler] Locking error for job', idKey, err);
          }
        } else {
          // In localStorage mode, guard against the same job running twice across ticks
          if (job.status !== 'pending') continue;
          job.status = 'processing';
          localStorage.setItem('btx_scheduled_tickets', JSON.stringify(this.scheduledTickets));
          this._renderScheduledTickets();
          canProceed = true;
        }

        if (canProceed) {
          this._runningJobs.add(idKey);
          this.executeScheduledJob(job).finally(() => this._runningJobs.delete(idKey));
        }
      }
    }, 10000);
  }

  _handleRealtimeScheduled(payload) {
    const { eventType, new: newRec, old: oldRec } = payload;
    if (eventType === 'INSERT') {
      const exists = this.scheduledTickets.some(t => t.id === newRec.id);
      if (!exists) {
        this.scheduledTickets.push(newRec);
        this.scheduledTickets.sort((a,b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
        this._renderScheduledTickets();
      }
    } else if (eventType === 'DELETE') {
      this.scheduledTickets = this.scheduledTickets.filter(t => t.id !== oldRec.id);
      this._renderScheduledTickets();
    } else if (eventType === 'UPDATE') {
      const idx = this.scheduledTickets.findIndex(t => t.id === newRec.id);
      if (idx !== -1) {
        this.scheduledTickets[idx] = newRec;
        this._renderScheduledTickets();
      }
    }
  }

  /* ═══ DB SYNC OPERATIONS ═══ */
  async _loadSavedRowsFromSupabase() {
    if (!supabaseClient) {
      this.savedRows = this._loadSavedRows();
      this._renderSavedRows();
      return;
    }
    try {
      console.log('Loading saved rows from Supabase...');
      const { data, error } = await supabaseClient.from('saved_rows').select('*').order('row_num', { ascending: true });
      if (error) throw error;
      
      this.savedRows = (data || []).map(r => ({
        id: r.id,
        rowNum: r.row_num,
        status: r.status,
        errors: r.notes && r.status === 'error' ? [r.notes] : [],
        warnings: r.notes && r.status === 'warn' ? [r.notes] : [],
        ids: {
          subject: this.dm?.resolveId('subject', r.subject) || null,
          grade: this.dm?.resolveId('grade', r.grade) || null,
          semester: this.dm?.resolveId('semester', r.semester) || null,
          unit: this.dm?.resolveId('unit', r.unit) || null,
          lesson: this.dm?.resolveId('lesson', r.lesson) || null,
          domain: this.dm?.resolveId('domain', r.domain) || null,
          topic: this.dm?.resolveId('topic', r.topic) || null,
          outcome: this.dm?.resolveId('outcome', r.outcome) || null,
          skill: this.dm?.resolveId('skill', r.skill) || null,
          itemType: this.dm?.resolveId('itemType', r.item_type) || null,
        },
        values: {
          subject: r.subject,
          grade: r.grade,
          semester: r.semester,
          unit: r.unit,
          lesson: r.lesson,
          domain: r.domain,
          topic: r.topic,
          outcome: r.outcome,
          skill: r.skill,
          itemType: r.item_type
        },
        sourceFile: r.source_file
      }));
      
      this._renderSavedRows();
    } catch (e) {
      console.warn('Failed to load saved rows from Supabase, falling back to localStorage:', e.message);
      this.savedRows = this._loadSavedRows();
      this._renderSavedRows();
    }
  }

  async _loadRecentTicketsFromSupabase() {
    if (!supabaseClient) {
      this._renderRecent(); // fallback to local storage
      return;
    }
    try {
      console.log('Loading recent tickets from Supabase...');
      const { data, error } = await supabaseClient.from('recent_tickets').select('*').order('created_at', { ascending: false }).limit(30);
      if (error) throw error;
      this.recentTickets = data || [];
      this._renderRecentTickets();
    } catch (e) {
      console.warn('Failed to load recent tickets from Supabase:', e.message);
      this.recentTickets = [];
      this._renderRecent();
    }
  }

  _handleRealtimeSavedRows(payload) {
    const { eventType, new: newRec, old: oldRec } = payload;
    if (eventType === 'INSERT') {
      const idx = this.savedRows.findIndex(r => r.id === newRec.id || r.rowNum === newRec.row_num);
      if (idx !== -1) {
        if (!this.savedRows[idx].id) {
          this.savedRows[idx].id = newRec.id;
          this._persistRows();
        }
      } else {
        this.savedRows.push({
          id: newRec.id,
          rowNum: newRec.row_num,
          status: newRec.status,
          errors: newRec.notes && newRec.status === 'error' ? [newRec.notes] : [],
          warnings: newRec.notes && newRec.status === 'warn' ? [newRec.notes] : [],
          ids: {
            subject: this.dm?.resolveId('subject', newRec.subject) || null,
            grade: this.dm?.resolveId('grade', newRec.grade) || null,
            semester: this.dm?.resolveId('semester', newRec.semester) || null,
            unit: this.dm?.resolveId('unit', newRec.unit) || null,
            lesson: this.dm?.resolveId('lesson', newRec.lesson) || null,
            domain: this.dm?.resolveId('domain', newRec.domain) || null,
            topic: this.dm?.resolveId('topic', newRec.topic) || null,
            outcome: this.dm?.resolveId('outcome', newRec.outcome) || null,
            skill: this.dm?.resolveId('skill', newRec.skill) || null,
            itemType: this.dm?.resolveId('itemType', newRec.item_type) || null,
          },
          values: {
            subject: newRec.subject,
            grade: newRec.grade,
            semester: newRec.semester,
            unit: newRec.unit,
            lesson: newRec.lesson,
            domain: newRec.domain,
            topic: newRec.topic,
            outcome: newRec.outcome,
            skill: newRec.skill,
            itemType: newRec.item_type
          },
          sourceFile: newRec.source_file
        });
        this.savedRows.sort((a, b) => a.rowNum - b.rowNum);
        this._renderSavedRows();
      }
    } else if (eventType === 'DELETE') {
      const deletedId = oldRec.id;
      this.savedRows = this.savedRows.filter(r => r.id !== deletedId);
      this._selectedRows.delete(oldRec.row_num);
      this._renderSavedRows();
    } else if (eventType === 'UPDATE') {
      const idx = this.savedRows.findIndex(r => r.id === newRec.id);
      if (idx !== -1) {
        this.savedRows[idx].status = newRec.status;
        this.savedRows[idx].errors = newRec.notes && newRec.status === 'error' ? [newRec.notes] : [];
        this.savedRows[idx].warnings = newRec.notes && newRec.status === 'warn' ? [newRec.notes] : [];
        this.savedRows[idx].values = {
          subject: newRec.subject,
          grade: newRec.grade,
          semester: newRec.semester,
          unit: newRec.unit,
          lesson: newRec.lesson,
          domain: newRec.domain,
          topic: newRec.topic,
          outcome: newRec.outcome,
          skill: newRec.skill,
          itemType: newRec.item_type
        };
        this._renderSavedRows();
      }
    }
  }

  _handleRealtimeRecentTickets(payload) {
    const { eventType, new: newRec, old: oldRec } = payload;
    if (eventType === 'INSERT') {
      const exists = this.recentTickets.some(t => t.id === newRec.id);
      if (!exists) {
        this.recentTickets.unshift(newRec);
        this.recentTickets = this.recentTickets.slice(0, 30);
        this._renderRecentTickets();
      }
    } else if (eventType === 'DELETE') {
      const deletedId = oldRec.id;
      this.recentTickets = this.recentTickets.filter(t => t.id !== deletedId);
      this._renderRecentTickets();
    }
  }

  _renderRecentTickets() {
    const wrap = document.getElementById('ctRecent');
    if (!this.recentTickets || !this.recentTickets.length) { wrap.style.display = 'none'; return; }
    wrap.style.display = 'block';
    
    // Sort recent tickets by created_at descending
    const sorted = [...this.recentTickets].sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    document.getElementById('ctRecentChips').innerHTML =
      sorted.map(t => {
        const title = t.subject ? `${t.subject} · Grade ${t.grade} · ${t.semester}` : '';
        return `<a href="https://spa.joacademy.com/page/content/ula_content_development/type/1440/details/${t.ticket_id}/" target="_blank" class="id-chip" style="text-decoration: none;" title="${title}">#${t.ticket_id}</a>`;
      }).join('');
  }

  async _autoConnect(forceRefresh = false) {
    this.dm  = new DataManager(this.api);
    this.val = new Validator(this.dm);

    const $ = id => document.getElementById(id);

    try {
      const hasCache = localStorage.getItem('btx_cache_data_v3');
      if (forceRefresh || !hasCache) {
        $('ctLoading').style.display = 'block';
        $('ctForm').style.display    = 'none';
        $('ctLoadSub').textContent   = 'Connecting to Bitrix24…';
      }

      await this.dm.load((step, state) => {
        /* just update subtitle during load — no individual step UI needed */
        const msgs = { fields: 'Fetching field definitions…', items: 'Loading existing items…', hier: 'Building hierarchy…' };
        if (state === 'loading') $('ctLoadSub').textContent = msgs[step];
      }, forceRefresh);

      $('connDot').className    = 'conn-dot dot-on';
      $('connLabel').textContent = forceRefresh ? 'Connected' : 'Connected (cached)';

      /* Re-populate selectors with the dynamically loaded options */
      this._populateSelects();

      /* Show form */
      $('ctLoading').style.display = 'none';
      $('ctForm').style.display    = 'block';
      $('syncBtn').style.display   = 'inline-flex';

      if (forceRefresh) {
        toast('Cache synced successfully from Bitrix24', 'success');
      }

    } catch (e) {
      $('connDot').className    = 'conn-dot dot-off';
      $('connLabel').textContent = 'Error';
      $('ctLoadSub').textContent = `Connection failed: ${e.message}`;
      toast(`Connection error: ${e.message}`, 'error', 8000);
    }
  }

  _checkAndRunAutoSync() {
    const schedule = this.cfg.schedule;
    if (schedule <= 0) return;
    
    const cached = localStorage.getItem('btx_cache_data_v3');
    if (!cached) return;
    try {
      const data = JSON.parse(cached);
      if (data.timestamp && (Date.now() - data.timestamp > schedule)) {
        console.log("Auto-syncing cache in background...");
        const syncBtn = document.getElementById('syncBtn');
        const syncIco = syncBtn?.querySelector('.sync-ico');
        if (syncBtn && syncIco) {
          syncBtn.disabled = true;
          syncIco.classList.add('spinning');
        }
        
        this.dm.load((step, state) => {}, true).then(() => {
          this._populateSelects();
          toast('Background auto-sync complete!', 'success');
        }).catch(e => {
          console.warn("Background auto-sync failed:", e.message);
        }).finally(() => {
          if (syncBtn && syncIco) {
            syncBtn.disabled = false;
            syncIco.classList.remove('spinning');
          }
        });
      }
    } catch (e) {
      console.warn("Auto-sync check failed:", e);
    }
  }

  /* ═══ POPULATE SELECTS (Create Ticket form) ═══ */
  _populateSelects() {
    const populate = (id, key, placeholder) => {
      const sel = document.getElementById(id);
      if (!sel) return;
      sel.innerHTML = `<option value="">${placeholder}</option>`;
      
      if (this.dm && this.dm.toTxt[key]) {
        for (const [vid, text] of this.dm.toTxt[key].entries()) {
          const opt = document.createElement('option');
          opt.value = vid;
          opt.textContent = text;
          sel.appendChild(opt);
        }
      } else {
        for (const { id: vid, text } of STATIC_ENUMS[key]) {
          const opt = document.createElement('option');
          opt.value = vid;
          opt.textContent = text;
          sel.appendChild(opt);
        }
      }
    };
    populate('fSubject',  'subject',  'Select subject…');
    populate('fGrade',    'grade',    'Select grade…');
    populate('fSemester', 'semester', 'Select semester…');

    // Populate Item Type as pills/checkboxes
    const grid = document.getElementById('fItemTypeGrid');
    if (grid) {
      grid.innerHTML = '';
      const items = [];
      if (this.dm && this.dm.toTxt.itemType) {
        for (const [vid, text] of this.dm.toTxt.itemType.entries()) {
          items.push({ id: vid, text });
        }
      } else {
        for (const { id: vid, text } of STATIC_ENUMS.itemType) {
          items.push({ id: String(vid), text });
        }
      }

      items.forEach(item => {
        const label = document.createElement('label');
        label.className = 'item-type-pill';
        label.innerHTML = `
          <input type="checkbox" value="${item.id}" data-text="${item.text}" class="f-item-type-chk">
          <span>${item.text}</span>
        `;
        const chk = label.querySelector('input');
        chk.addEventListener('change', () => {
          label.classList.toggle('active', chk.checked);
        });
        grid.appendChild(label);
      });
    }
  }

  _updateSkillField() {
    const $ = id => document.getElementById(id);
    const subjectId = $('fSubject').value;
    const gradeId = $('fGrade').value;
    const semesterId = $('fSemester').value;
    const unit = $('fUnit').value;
    const lesson = $('fLesson').value;

    const skillInput = document.getElementById('fSkill');
    if (!skillInput) return;
    const skillContainer = skillInput.parentNode;

    if (!subjectId || !gradeId || !semesterId || !unit || !lesson || unit === '__custom__' || lesson === '__custom__') {
      skillContainer.innerHTML = `
        <label class="form-label" for="fSkill">Skill</label>
        <input type="text" id="fSkill" class="form-input" placeholder="Skill…" />
      `;
      return;
    }

    const s = this.dm.toTxt.subject?.get(String(subjectId));
    const g = this.dm.toTxt.grade?.get(String(gradeId));
    const sem = this.dm.toTxt.semester?.get(String(semesterId));

    const skillsSet = (s && g && sem) ? this.dm.tree[s]?.[g]?.[sem]?.[unit]?.[lesson] : null;

    if (skillsSet && skillsSet.size > 0) {
      const skillsArray = Array.from(skillsSet).filter(Boolean);
      if (skillsArray.length === 1) {
        skillContainer.innerHTML = `
          <label class="form-label" for="fSkill">Skill</label>
          <input type="text" id="fSkill" class="form-input" placeholder="Skill…" value="${skillsArray[0]}" />
        `;
      } else if (skillsArray.length > 1) {
        const optionsHtml = skillsArray.map(sk => `<option value="${sk}">${sk}</option>`).join('');
        skillContainer.innerHTML = `
          <label class="form-label" for="fSkill">Skill</label>
          <select id="fSkill" class="form-select">
            <option value="" disabled selected>Select skill…</option>
            ${optionsHtml}
            <option value="__custom__">+ Add Custom…</option>
          </select>
        `;

        const fSkillSelect = document.getElementById('fSkill');
        fSkillSelect.addEventListener('change', e => {
          if (e.target.value === '__custom__') {
            const custom = prompt('Enter custom Skill:');
            if (custom && custom.trim()) {
              const val = custom.trim();
              const opt = document.createElement('option');
              opt.value = val;
              opt.textContent = val;
              fSkillSelect.insertBefore(opt, fSkillSelect.lastChild);
              fSkillSelect.value = val;
            } else {
              fSkillSelect.value = '';
            }
          }
        });
      } else {
        skillContainer.innerHTML = `
          <label class="form-label" for="fSkill">Skill</label>
          <input type="text" id="fSkill" class="form-input" placeholder="Skill…" />
        `;
      }
    } else {
      skillContainer.innerHTML = `
        <label class="form-label" for="fSkill">Skill</label>
        <input type="text" id="fSkill" class="form-input" placeholder="Skill…" />
      `;
    }
  }

  _updateUnitDropdown() {
    const $ = id => document.getElementById(id);
    const subjectId = $('fSubject').value;
    const gradeId = $('fGrade').value;
    const semesterId = $('fSemester').value;

    const unitSel = $('fUnit');
    unitSel.innerHTML = '<option value="">Select unit…</option>';
    
    const lessonSel = $('fLesson');
    lessonSel.innerHTML = '<option value="">Select lesson…</option>';

    this._updateSkillField();

    if (!subjectId || !gradeId || !semesterId) return;

    const s = this.dm.toTxt.subject?.get(String(subjectId));
    const g = this.dm.toTxt.grade?.get(String(gradeId));
    const sem = this.dm.toTxt.semester?.get(String(semesterId));

    if (!s || !g || !sem) return;

    const units = Object.keys(this.dm.tree[s]?.[g]?.[sem] || {});
    for (const unit of units.sort()) {
      const opt = document.createElement('option');
      opt.value = unit;
      opt.textContent = unit;
      unitSel.appendChild(opt);
    }
    
    // Add custom option at the end
    const optCustom = document.createElement('option');
    optCustom.value = '__custom__';
    optCustom.textContent = '+ Add Custom…';
    unitSel.appendChild(optCustom);
  }

  _updateLessonDropdown() {
    const $ = id => document.getElementById(id);
    const subjectId = $('fSubject').value;
    const gradeId = $('fGrade').value;
    const semesterId = $('fSemester').value;
    const unit = $('fUnit').value;

    const lessonSel = $('fLesson');
    lessonSel.innerHTML = '<option value="">Select lesson…</option>';

    this._updateSkillField();

    if (!subjectId || !gradeId || !semesterId || !unit || unit === '__custom__') return;

    const s = this.dm.toTxt.subject?.get(String(subjectId));
    const g = this.dm.toTxt.grade?.get(String(gradeId));
    const sem = this.dm.toTxt.semester?.get(String(semesterId));

    if (!s || !g || !sem) return;

    const lessonsMap = this.dm.tree[s]?.[g]?.[sem]?.[unit];
    if (lessonsMap) {
      const lessons = Object.keys(lessonsMap);
      for (const lesson of lessons.sort()) {
        const opt = document.createElement('option');
        opt.value = lesson;
        opt.textContent = lesson;
        lessonSel.appendChild(opt);
      }
    }

    // Add custom option at the end
    const optCustom = document.createElement('option');
    optCustom.value = '__custom__';
    optCustom.textContent = '+ Add Custom…';
    lessonSel.appendChild(optCustom);
  }

  _addCustomToTree(unit, lesson, skill = '') {
    const $ = id => document.getElementById(id);
    const subjectId = $('fSubject').value;
    const gradeId = $('fGrade').value;
    const semesterId = $('fSemester').value;
    
    if (!subjectId || !gradeId || !semesterId) return;

    const s = this.dm.toTxt.subject?.get(String(subjectId));
    const g = this.dm.toTxt.grade?.get(String(gradeId));
    const sem = this.dm.toTxt.semester?.get(String(semesterId));

    if (!s || !g || !sem) return;

    if (!this.dm.tree[s]) this.dm.tree[s] = {};
    if (!this.dm.tree[s][g]) this.dm.tree[s][g] = {};
    if (!this.dm.tree[s][g][sem]) this.dm.tree[s][g][sem] = {};
    
    if (unit) {
      if (!this.dm.tree[s][g][sem][unit]) this.dm.tree[s][g][sem][unit] = {};
      if (lesson) {
        if (!this.dm.tree[s][g][sem][unit][lesson]) this.dm.tree[s][g][sem][unit][lesson] = new Set();
        if (skill) {
          this.dm.tree[s][g][sem][unit][lesson].add(skill);
        }
      }
    }
    
    this.dm.saveCache();
    
    // Save to Supabase (fires realtime event for others)
    this.dm.addCustomToSupabase(s, g, sem, unit, lesson, skill);
  }

  /* ═══ EVENT BINDINGS ═══ */
  _bindAll() {
    const $ = id => document.getElementById(id);

    /* Sync Button */
    $('syncBtn').addEventListener('click', () => {
      const syncBtn = $('syncBtn');
      const syncIco = syncBtn.querySelector('.sync-ico');
      if (syncBtn.disabled || syncIco.classList.contains('spinning')) return;
      syncBtn.disabled = true;
      syncIco.classList.add('spinning');
      this._autoConnect(true).finally(() => {
        syncBtn.disabled = false;
        syncIco.classList.remove('spinning');
      });
    });

    /* Tabs */
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => this._switchTab(btn.dataset.tab));
    });

    /* Settings */
    $('settingsBtn').addEventListener('click', () => {
      $('setConcurrency').value = String(this.cfg.concurrency);
      $('setSyncSchedule').value = String(this.cfg.schedule);
      $('settingsOverlay').style.display = 'flex';
    });
    $('closeSettings').addEventListener('click',  () => $('settingsOverlay').style.display = 'none');
    $('cancelSettings').addEventListener('click', () => $('settingsOverlay').style.display = 'none');
    $('saveSettings').addEventListener('click', () => {
      this.cfg.concurrency = parseInt($('setConcurrency').value);
      this.cfg.schedule    = parseInt($('setSyncSchedule').value);
      localStorage.setItem(LS_CC_KEY, String(this.cfg.concurrency));
      localStorage.setItem(LS_SCHED_KEY, String(this.cfg.schedule));
      $('settingsOverlay').style.display = 'none';
      toast('Settings saved', 'success');
      this._checkAndRunAutoSync();
    });
    $('settingsOverlay').addEventListener('click', e => { if (e.target===$('settingsOverlay')) $('settingsOverlay').style.display='none'; });

    /* ─── CREATE TICKET form ─── */
    $('ctSubmitBtn').addEventListener('click', () => this._createSingleTicket());
    $('ctClearBtn').addEventListener('click',  () => this._clearForm());
    $('ctClearRecent').addEventListener('click', () => {
      localStorage.removeItem(LS_RECENT);
      $('ctRecent').style.display = 'none';
    });

    /* Theme toggle */
    $('themeToggleBtn').addEventListener('click', () => {
      const currTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      const newTheme = currTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('btx_theme', newTheme);
      this._updateThemeIconDisplay(newTheme);
      toast(`Switched to ${newTheme} mode!`, 'info');
    });

    /* Scheduling modal triggers */
    $('ctScheduleOpenBtn').addEventListener('click', () => {
      const subject = $('fSubject').value;
      const grade = $('fGrade').value;
      const semester = $('fSemester').value;
      if (!subject || !grade || !semester) {
        toast('Subject, Grade, and Semester are required to schedule.', 'error');
        return;
      }
      this._schedulingSource = 'single';
      $('fModalScheduleTime').value = '';
      $('scheduleModalOverlay').style.display = 'flex';
      
      const nowStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      $('fModalScheduleTime').min = nowStr;
    });

    $('bulkScheduleOpenBtn').addEventListener('click', () => {
      const toSchedule = this.savedRows.filter(r => this._selectedRows.has(r.rowNum));
      if (!toSchedule.length) {
        toast('No rows selected to schedule.', 'error');
        return;
      }
      this._schedulingSource = 'bulk';
      $('fModalScheduleTime').value = '';
      $('scheduleModalOverlay').style.display = 'flex';
      
      const nowStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      $('fModalScheduleTime').min = nowStr;
    });

    $('closeScheduleModal').addEventListener('click', () => $('scheduleModalOverlay').style.display = 'none');
    $('cancelScheduleModal').addEventListener('click', () => $('scheduleModalOverlay').style.display = 'none');
    $('confirmScheduleBtn').addEventListener('click', () => this._submitSchedule());

    $('refreshScheduledBtn').addEventListener('click', () => {
      const ico = $('refreshScheduledBtn').querySelector('.sync-ico');
      ico.classList.add('spinning');
      this._loadScheduledTickets().finally(() => ico.classList.remove('spinning'));
    });
    $('clearScheduledBtn').addEventListener('click', () => this.clearAllScheduledJobs());
    $('scheduledSearch').addEventListener('input', () => this._renderScheduledTickets());

    /* Cascading Dropdowns for Unit and Lesson */
    $('fSubject').addEventListener('change',  () => this._updateUnitDropdown());
    $('fGrade').addEventListener('change',    () => this._updateUnitDropdown());
    $('fSemester').addEventListener('change', () => this._updateUnitDropdown());

    $('fUnit').addEventListener('change', () => {
      if ($('fUnit').value === '__custom__') {
        const val = prompt('Enter custom Unit name:');
        if (val && val.trim()) {
          const clean = val.trim();
          const opt = document.createElement('option');
          opt.value = clean;
          opt.textContent = clean;
          const unitSel = $('fUnit');
          unitSel.insertBefore(opt, unitSel.lastChild);
          unitSel.value = clean;
          
          this._addCustomToTree(clean, null);
          this._updateLessonDropdown();
        } else {
          $('fUnit').value = '';
        }
      } else {
        this._updateLessonDropdown();
      }
    });

    $('fLesson').addEventListener('change', () => {
      if ($('fLesson').value === '__custom__') {
        const val = prompt('Enter custom Lesson name:');
        if (val && val.trim()) {
          const clean = val.trim();
          const opt = document.createElement('option');
          opt.value = clean;
          opt.textContent = clean;
          const lessonSel = $('fLesson');
          lessonSel.insertBefore(opt, lessonSel.lastChild);
          lessonSel.value = clean;
          
          this._addCustomToTree($('fUnit').value, clean);
          this._updateSkillField();
        } else {
          $('fLesson').value = '';
          this._updateSkillField();
        }
      } else {
        this._updateSkillField();
      }
    });

    /* ─── BULK UPLOAD ─── */
    const dz = $('dropZone'), fi = $('fileInput');
    $('browseBtn').addEventListener('click', e => { e.stopPropagation(); fi.click(); });
    dz.addEventListener('click',    () => fi.click());
    fi.addEventListener('change',   e => { if (e.target.files[0]) this._loadExcel(e.target.files[0]); });
    dz.addEventListener('dragover',  e => { e.preventDefault(); dz.classList.add('over'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('over'));
    dz.addEventListener('drop', e => {
      e.preventDefault(); dz.classList.remove('over');
      if (e.dataTransfer.files[0]) this._loadExcel(e.dataTransfer.files[0]);
    });

    $('clearSavedBtn').addEventListener('click', () => {
      if (!confirm('Clear all saved rows?')) return;
      this.savedRows = [];
      this._persistRows();
      this._renderSavedRows();
      if (supabaseClient) {
        supabaseClient.from('saved_rows').delete().neq('id', 0).then(({ error }) => {
          if (error) console.error('Failed to clear saved rows on Supabase:', error.message);
        });
      }
      toast('Cleared', 'info');
    });

    /* Selection */
    $('selAllValid').addEventListener('click', () => {
      this._selectedRows.clear();
      this.savedRows.filter(r => r.status !== 'error' && this._isVisible(r.rowNum)).forEach(r => this._selectedRows.add(r.rowNum));
      this._syncCheckboxes(); this._updateSelCount();
    });
    $('selAllRows').addEventListener('click', () => {
      this.savedRows.filter(r => this._isVisible(r.rowNum)).forEach(r => this._selectedRows.add(r.rowNum));
      this._syncCheckboxes(); this._updateSelCount();
    });
    $('selNone').addEventListener('click', () => {
      this._selectedRows.clear(); this._syncCheckboxes(); this._updateSelCount();
    });
    $('masterChk').addEventListener('change', e => {
      const vis = this.savedRows.filter(r => this._isVisible(r.rowNum));
      if (e.target.checked) vis.filter(r => r.status !== 'error').forEach(r => this._selectedRows.add(r.rowNum));
      else vis.forEach(r => this._selectedRows.delete(r.rowNum));
      this._syncCheckboxes(); this._updateSelCount();
    });

    /* Filter + search */
    document.querySelectorAll('.f-btn').forEach(b => b.addEventListener('click', () => this._applyFilter(b.dataset.filter)));
    $('tableSearch').addEventListener('input', e => this._applyFilter(null, e.target.value));

    /* Bulk create */
    $('bulkCreateBtn').addEventListener('click', () => this._bulkCreate());
    $('dlErrBtn').addEventListener('click', () => {
      ExcelHandler.exportErrors(this.savedRows.filter(r => r.status === 'error'));
    });

    /* Report modal */
    $('closeReport').addEventListener('click',    () => $('reportOverlay').style.display = 'none');
    $('closeReportBtn').addEventListener('click', () => $('reportOverlay').style.display = 'none');
    $('dlFailedBtn').addEventListener('click',    () => ExcelHandler.exportErrors(this._allResults.filter(r => r.finalStatus !== 'created')));
    $('dlReportBtn').addEventListener('click',    () => ExcelHandler.exportReport(this._allResults));
    $('reportOverlay').addEventListener('click', e => { if (e.target===$('reportOverlay')) $('reportOverlay').style.display='none'; });

    /* Add / Edit Row Modal Events */
    $('addRowBtn').addEventListener('click', () => this._openAddRowModal());
    $('closeEditRow').addEventListener('click', () => $('editRowOverlay').style.display = 'none');
    $('cancelEditRow').addEventListener('click', () => $('editRowOverlay').style.display = 'none');
    $('saveEditRowBtn').addEventListener('click', () => this._saveRowFromModal());
    $('editRowOverlay').addEventListener('click', e => { if (e.target === $('editRowOverlay')) $('editRowOverlay').style.display = 'none'; });

    /* Lessons & Units events */
    $('lessonsSearch').addEventListener('input', e => {
      const term = e.target.value.toLowerCase().trim();
      document.querySelectorAll('#lessonsBody tr').forEach(tr => {
        const ms = !term || tr.dataset.search?.includes(term);
        tr.style.display = ms ? '' : 'none';
      });
    });

    $('refreshLessonsBtn').addEventListener('click', () => {
      const btn = $('refreshLessonsBtn');
      const ico = btn.querySelector('.sync-ico');
      if (ico.classList.contains('spinning')) return;
      ico.classList.add('spinning');
      this._loadLessonsFromSupabase().finally(() => {
        ico.classList.remove('spinning');
      });
    });

    $('clearLessonsBtn').addEventListener('click', () => this._clearAllLessons());

    const dsi = $('deleteSheetInput');
    $('deleteSheetBtn').addEventListener('click', () => {
      dsi.value = '';
      dsi.click();
    });
    dsi.addEventListener('change', e => {
      if (e.target.files[0]) this._handleDeleteFromSheet(e.target.files[0]);
    });
  }

  /* ═══ TAB SWITCHING ═══ */
  _switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    document.querySelectorAll('.tab-panel').forEach(p => p.style.display = 'none');
    document.getElementById(`tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`).style.display = 'block';
    
    if (tab === 'lessons') {
      this._loadLessonsFromSupabase();
    } else if (tab === 'scheduled') {
      this._loadScheduledTickets();
    }
  }

  /* ═══ CREATE SINGLE TICKET ═══ */
  async _createSingleTicket() {
    const $ = id => document.getElementById(id);
    if (!this.dm) { toast('Not connected', 'error'); return; }

    const values = {
      subject:  $('fSubject').value,
      grade:    $('fGrade').value,
      semester: $('fSemester').value,
      unit:     $('fUnit').value.trim(),
      lesson:   $('fLesson').value.trim(),
      domain:   $('fDomain').value.trim(),
      topic:    $('fTopic').value.trim(),
      outcome:  $('fOutcome').value.trim(),
      skill:    $('fSkill').value.trim(),
    };

    if (!values.subject || !values.grade || !values.semester) {
      toast('Subject, Grade, and Semester are required', 'error');
      return;
    }

    // Read multiple selected item types from checkboxes
    const checkedChks = Array.from(document.querySelectorAll('.f-item-type-chk:checked'));
    const checkedTypes = checkedChks.map(c => ({
      id: parseInt(c.value),
      text: c.dataset.text
    }));

    /* For the label display */
    const subjectText  = $('fSubject').options[$('fSubject').selectedIndex]?.text || '';
    const gradeText    = $('fGrade').options[$('fGrade').selectedIndex]?.text || '';
    const semesterText = $('fSemester').options[$('fSemester').selectedIndex]?.text || '';

    const btn = $('ctSubmitBtn');
    btn.disabled = true;

    const result = document.getElementById('ctResult');
    result.style.display = 'none';

    try {
      const creator = new TicketCreator(this.api);
      const typesToCreate = checkedTypes.length > 0 ? checkedTypes : [{ id: null, text: '' }];
      const createdTickets = [];

      for (let index = 0; index < typesToCreate.length; index++) {
        const itemTypeObj = typesToCreate[index];
        btn.innerHTML = `<div class="btn-spinner"></div> Creating ${index + 1}/${typesToCreate.length}…`;

        /* Build numeric IDs directly from select values or lookup maps */
        const ids = {
          subject:  values.subject  ? parseInt(values.subject)  : null,
          grade:    values.grade    ? parseInt(values.grade)    : null,
          semester: values.semester ? parseInt(values.semester) : null,
          itemType: itemTypeObj.id,
          unit:     this.dm.resolveId('unit', values.unit),
          lesson:   this.dm.resolveId('lesson', values.lesson),
          domain:   this.dm.resolveId('domain', values.domain),
          topic:    this.dm.resolveId('topic', values.topic),
          outcome:  this.dm.resolveId('outcome', values.outcome),
          skill:    this.dm.resolveId('skill', values.skill),
        };

        const payload = creator._buildFields({ ids, values: { ...values, itemType: itemTypeObj.text || '' } });

        // Auto-assign responsible person based on subject (and unit name for Science)
        const assigneeId = this._resolveAssigneeId(subjectText, values.unit);
        if (assigneeId) {
          payload['assignedById']             = assigneeId;
          payload['ufCrm160_1755078076']      = assigneeId;
        }

        console.log(`Submitting payload for "${itemTypeObj.text || 'No Item Type'}" to Bitrix:`, JSON.stringify(payload, null, 2));

        const res = await this.api.createItem(payload);
        const ticketId = res.result?.item?.id || res.result?.id || null;

        let displayId = ticketId;

        if (ticketId) {
          const numericId = parseInt(ticketId);
          
          // WORKAROUND: Bitrix24 clears Unit and Lesson fields on creation due to active automation rules
          // that clone/move the item into another stage/category, creating a new item with ID + 1.
          console.log(`WORKAROUND: Waiting 1.5s for automation rule to clone ticket #${numericId}...`);
          await sleep(1500);

          const searchTitle = `ULA Content Development #${numericId}`;
          let targetId = numericId;
          
          try {
            console.log(`Searching for copied ticket with title "${searchTitle}"...`);
            const searchRes = await this.api.call('crm.item.list', {
              entityTypeId: ENTITY_TYPE,
              filter: { "title": searchTitle }
            });
            const items = searchRes.result?.items || searchRes.result || [];
            if (items.length > 0) {
              targetId = parseInt(items[0].id);
              console.log(`Target copied item ID found: ${targetId}`);
            } else {
              console.log("No copied item found by title search. Falling back to ID + 1.");
              targetId = numericId + 1;
            }
          } catch (searchErr) {
            console.warn("Search failed, falling back to ID + 1:", searchErr);
            targetId = numericId + 1;
          }

          console.log(`WORKAROUND: Updating copied ticket #${targetId} with Unit, Lesson, and Metadata...`);
          const updatePayload = {
            [FIELDS.unit.id]: values.unit,
            [FIELDS.lesson.id]: values.lesson,
            [FIELDS.domain.id]: values.domain,
            [FIELDS.topic.id]: values.topic,
            [FIELDS.outcome.id]: values.outcome,
            [FIELDS.skill.id]: values.skill
          };
          
          try {
            await this.api.call('crm.item.update', {
              entityTypeId: ENTITY_TYPE,
              id: targetId,
              fields: updatePayload
            });
            displayId = targetId; // link to the actual copied ticket with populated fields
          } catch (updateErr) {
            console.error(`Failed to update ticket #${targetId}:`, updateErr.message);
            // If update fails on targetId (e.g. if targetId doesn't exist), try original numericId
            try {
              await this.api.call('crm.item.update', {
                entityTypeId: ENTITY_TYPE,
                id: numericId,
                fields: updatePayload
              });
            } catch (origErr) {
              console.error(`Failed to update original ticket #${numericId} as well:`, origErr.message);
            }
          }

          const displayIdStr = String(displayId);
          /* Save to recent */
          this._addRecentId(displayIdStr);
          this._addRecentTicketToSupabase(displayIdStr, subjectText, gradeText, semesterText);
          createdTickets.push({ id: displayIdStr, typeText: itemTypeObj.text || '' });
        }
      }

      if (createdTickets.length > 0) {
        result.className = 'ct-result-banner ct-result-ok';
        const ticketsLinks = createdTickets.map(t => {
          const suffix = t.typeText ? ` (${t.typeText})` : '';
          return `<a href="https://spa.joacademy.com/page/content/ula_content_development/type/1440/details/${t.id}/" target="_blank" style="color: var(--cyan); text-decoration: underline; font-weight: 700; margin: 0 4px;">#${t.id}</a>${suffix}`;
        }).join(', ');

        result.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          Created ${createdTickets.length} ticket(s): ${ticketsLinks} — ${subjectText} · Grade ${gradeText} · ${semesterText}
        `;
        result.style.display = 'flex';
        toast(`Successfully created ${createdTickets.length} ticket(s)!`, 'success');
        
        /* Clear form inputs */
        this._clearForm();
      }

    } catch (e) {
      result.className = 'ct-result-banner ct-result-err';
      result.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        Failed: ${e.message}
      `;
      result.style.display = 'flex';
      toast(`Error: ${e.message}`, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Create Ticket';
    }
  }

  _clearForm() {
    ['fSubject','fGrade','fSemester'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    
    // Cascades clear down to Unit, Lesson, and Skill
    this._updateUnitDropdown();

    ['fDomain','fTopic','fOutcome'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    
    // Clear item type checkbox pills
    document.querySelectorAll('.f-item-type-chk').forEach(chk => {
      chk.checked = false;
      const label = chk.closest('.item-type-pill');
      if (label) label.classList.remove('active');
    });

    const res = document.getElementById('ctResult');
    res.style.display = 'none';
  }

  _addRecentId(id) {
    const recent = JSON.parse(localStorage.getItem(LS_RECENT) || '[]');
    recent.unshift(String(id));
    const trimmed = recent.slice(0, 30);
    localStorage.setItem(LS_RECENT, JSON.stringify(trimmed));
    this._renderRecent();
  }

  async _addRecentTicketToSupabase(ticketId, subject, grade, semester) {
    if (!supabaseClient) return;
    try {
      await supabaseClient.from('recent_tickets').insert({
        ticket_id: parseInt(ticketId),
        subject,
        grade,
        semester
      });
    } catch (e) {
      console.error('Failed to save recent ticket to Supabase:', e.message);
    }
  }

  _renderRecent() {
    const recent = JSON.parse(localStorage.getItem(LS_RECENT) || '[]');
    const wrap   = document.getElementById('ctRecent');
    if (!recent.length) { wrap.style.display = 'none'; return; }
    wrap.style.display = 'block';
    document.getElementById('ctRecentChips').innerHTML =
      recent.map(id => `<a href="https://spa.joacademy.com/page/content/ula_content_development/type/1440/details/${id}/" target="_blank" class="id-chip" style="text-decoration: none;">#${id}</a>`).join('');
  }

  /* ═══ EXCEL LOAD & SAVE ═══ */
  async _loadExcel(file) {
    if (!this.val) { toast('Still connecting, please wait…', 'info'); return; }
    try {
      const { headers, rows } = await ExcelHandler.parse(file);
      const mapping = this._autoMap(headers);
      const validated = this.val.validateAll(rows, mapping);

      /* Merge into saved rows (append, avoiding duplicates by adding fresh rowNums) */
      const offset = this.savedRows.length ? Math.max(...this.savedRows.map(r => r.rowNum)) + 1 : 0;
      const newRows = validated.map(r => ({ ...r, rowNum: r.rowNum + offset, sourceFile: file.name }));

      if (supabaseClient) {
        const dbRows = newRows.map(r => ({
          row_num: r.rowNum,
          subject: r.values.subject,
          grade: r.values.grade,
          semester: r.values.semester,
          unit: r.values.unit,
          lesson: r.values.lesson,
          domain: r.values.domain,
          topic: r.values.topic,
          outcome: r.values.outcome,
          skill: r.values.skill,
          item_type: r.values.itemType,
          status: r.status,
          notes: r.errors?.[0] || r.warnings?.[0] || '',
          source_file: r.sourceFile
        }));
        
        // Append locally immediately for instant visual response
        this.savedRows = [...this.savedRows, ...newRows];
        this._persistRows();
        this._renderSavedRows();

        // Sync to Supabase in the background
        supabaseClient.from('saved_rows').insert(dbRows).select().then(({ data, error }) => {
          if (error) {
            console.warn('Failed to sync uploaded rows to Supabase:', error.message);
          } else if (data && data.length > 0) {
            // Update local rows with database IDs
            data.forEach(dbRow => {
              const matchedLocal = this.savedRows.find(nr => nr.rowNum === dbRow.row_num);
              if (matchedLocal) matchedLocal.id = dbRow.id;
            });
            this._persistRows();
          }
        });
      } else {
        this.savedRows = [...this.savedRows, ...newRows];
        this._persistRows();
        this._renderSavedRows();
      }

      /* Auto-select all valid */
      newRows.filter(r => r.status !== 'error').forEach(r => this._selectedRows.add(r.rowNum));
      this._syncCheckboxes();
      this._updateSelCount();

      toast(`Saved ${newRows.length} rows from "${file.name}"`, 'success', 5000);
      document.getElementById('fileInput').value = '';
    } catch (e) {
      toast(`Parse error: ${e.message}`, 'error');
    }
  }

  _autoMap(headers) {
    const mapping = {};
    const norm = headers.map(h => h.toLowerCase().trim());
    for (const [key, aliases] of Object.entries(ALIASES)) {
      for (const alias of aliases) {
        const idx = norm.indexOf(alias.toLowerCase());
        if (idx !== -1) { mapping[key] = idx; break; }
      }
    }
    return mapping;
  }

  _persistRows() {
    localStorage.setItem(LS_ROWS_KEY, JSON.stringify(this.savedRows));
  }

  _loadSavedRows() {
    try { return JSON.parse(localStorage.getItem(LS_ROWS_KEY) || '[]'); }
    catch { return []; }
  }

  /* ═══ RENDER SAVED ROWS TABLE ═══ */
  _renderSavedRows() {
    const $ = id => document.getElementById(id);
    const rows = this.savedRows;

    if (!rows.length) {
      $('savedSection').style.display = 'none';
      $('bulkBadge').style.display    = 'none';
      return;
    }

    $('savedSection').style.display = 'block';
    $('bulkBadge').style.display    = 'inline-flex';
    $('bulkBadge').textContent       = rows.length;

    const total = rows.length;
    const valid = rows.filter(r => r.status === 'valid').length;
    const warn  = rows.filter(r => r.status === 'warn').length;
    const err   = rows.filter(r => r.status === 'error').length;

    $('statTotal').textContent   = total;
    $('statValid').textContent   = valid;
    $('statWarn').textContent    = warn;
    $('statError').textContent   = err;
    $('savedInfoText').textContent = `${total} row${total !== 1 ? 's' : ''} saved`;
    $('dlErrBtn').style.display  = err > 0 ? 'inline-flex' : 'none';

    const tbody = $('valBody');
    tbody.innerHTML = '';

    for (const r of rows) {
      const tr = document.createElement('tr');
      tr.className      = `r-${r.status}`;
      tr.dataset.status = r.status;
      tr.dataset.rowNum = r.rowNum;
      tr.dataset.search = [r.values?.subject, r.values?.grade, r.values?.semester, r.values?.unit, r.values?.lesson, r.sourceFile].join(' ').toLowerCase();

      const badge = {
        valid: '<span class="sbadge sb-ok">✓ Valid</span>',
        warn:  '<span class="sbadge sb-wrn">⚠ Warning</span>',
        error: '<span class="sbadge sb-err">✗ Error</span>',
      }[r.status];

      const msg = r.errors?.[0] || r.warnings?.[0] || '—';
      const disabled = r.status === 'error' ? 'disabled' : '';

      const s = r.values?.subject;
      const g = r.values?.grade;
      const sem = r.values?.semester;
      const u = r.values?.unit;
      const l = r.values?.lesson;

      let skillCellHtml = '';
      const skillsSet = (s && g && sem && u && l) ? this.dm.tree[s]?.[g]?.[sem]?.[u]?.[l] : null;

      if (skillsSet && skillsSet.size > 1) {
        const options = Array.from(skillsSet).map(sk => {
          const selected = r.values?.skill === sk ? 'selected' : '';
          return `<option value="${sk}" ${selected}>${sk}</option>`;
        }).join('');

        const hasMatch = Array.from(skillsSet).includes(r.values?.skill);
        const customVal = (!r.values?.skill || !hasMatch) ? (r.values?.skill || '') : '';

        skillCellHtml = `
          <td>
            <select class="row-skill-select form-select-sm" data-row="${r.rowNum}" style="width: 100%; max-width: 155px; padding: 3px 6px; font-size: 12px; border-radius: 4px; border: 1px solid var(--border); background-color: #fff; color: var(--t1);">
              <option value="" disabled ${!r.values?.skill ? 'selected' : ''}>Select skill…</option>
              ${options}
              ${customVal ? `<option value="${customVal}" selected>${customVal}</option>` : ''}
              <option value="__custom__">+ Add Custom…</option>
            </select>
          </td>
        `;
      } else {
        skillCellHtml = `<td title="${r.values?.skill || ''}">${truncate(r.values?.skill, 24)}</td>`;
      }

      tr.innerHTML = `
        <td class="col-chk td-chk">
          <input type="checkbox" class="row-chk" data-row="${r.rowNum}" ${disabled}>
        </td>
        <td class="td-num">${r.rowNum}</td>
        <td>${r.values?.subject  || '—'}</td>
        <td>${r.values?.grade    || '—'}</td>
        <td>${r.values?.semester || '—'}</td>
        <td title="${r.values?.unit   || ''}">${truncate(r.values?.unit,   24)}</td>
        <td title="${r.values?.lesson || ''}">${truncate(r.values?.lesson, 24)}</td>
        ${skillCellHtml}
        <td class="col-status">${badge}</td>
        <td class="col-msg td-msg" title="${msg}">${truncate(msg, 50)}</td>
        <td class="td-actions">
          <button class="action-icon-btn btn-edit" title="Edit row">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"/></svg>
          </button>
          <button class="action-icon-btn btn-delete" title="Delete row">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>
        </td>
      `;

      const chk = tr.querySelector('.row-chk');
      chk.checked = this._selectedRows.has(r.rowNum);
      chk.addEventListener('change', e => {
        if (e.target.checked) this._selectedRows.add(r.rowNum);
        else this._selectedRows.delete(r.rowNum);
        this._updateSelCount();
      });

      const skillSel = tr.querySelector('.row-skill-select');
      if (skillSel) {
        skillSel.addEventListener('click', e => e.stopPropagation());
        skillSel.addEventListener('change', async e => {
          let val = e.target.value;
          if (val === '__custom__') {
            const custom = prompt('Enter custom Skill:');
            if (custom && custom.trim()) {
              val = custom.trim();
              const opt = document.createElement('option');
              opt.value = val;
              opt.textContent = val;
              skillSel.insertBefore(opt, skillSel.lastChild);
              skillSel.value = val;
            } else {
              skillSel.value = r.values?.skill || '';
              return;
            }
          }
          await this._updateRowSkill(r.id, r.rowNum, val);
        });
      }
      
      tr.querySelector('.btn-edit').addEventListener('click', e => {
        e.stopPropagation();
        this._openEditRowModal(r.id);
      });

      tr.querySelector('.btn-delete').addEventListener('click', e => {
        e.stopPropagation();
        this._deleteRow(r.id, r.rowNum);
      });

      tr.addEventListener('click', e => {
        if (e.target.tagName === 'INPUT' || e.target.closest('.action-icon-btn') || e.target.closest('select') || r.status === 'error') return;
        if (this._selectedRows.has(r.rowNum)) { this._selectedRows.delete(r.rowNum); chk.checked = false; }
        else { this._selectedRows.add(r.rowNum); chk.checked = true; }
        this._updateSelCount();
      });

      tbody.appendChild(tr);
    }

    this._updateSelCount();
  }

  async _updateRowSkill(id, rowNum, newSkill) {
    const idx = this.savedRows.findIndex(r => r.rowNum === rowNum);
    if (idx === -1) return;

    const row = this.savedRows[idx];
    row.values.skill = newSkill;

    const mapping = {
      subject: 0, grade: 1, semester: 2, unit: 3, lesson: 4,
      domain: 5, topic: 6, outcome: 7, skill: 8, itemType: 9
    };
    const rowData = [
      row.values.subject, row.values.grade, row.values.semester, row.values.unit, row.values.lesson,
      row.values.domain, row.values.topic, row.values.outcome, row.values.skill, row.values.itemType
    ];

    const validated = this.val.validateRow(rowData, mapping);
    row.status = validated.status;
    row.errors = validated.errors;
    row.warnings = validated.warnings;
    row.ids = validated.ids;

    if (supabaseClient && id != null) {
      try {
        const { error } = await supabaseClient.from('saved_rows').update({
          skill: newSkill,
          status: row.status,
          notes: row.errors?.[0] || row.warnings?.[0] || ''
        }).eq('id', id);
        if (error) throw error;
        toast('Skill updated successfully!', 'success');
      } catch (err) {
        console.error('Failed to update row skill on Supabase:', err.message);
        toast(`Database error: ${err.message}`, 'error');
      }
    } else {
      this._persistRows();
      this._renderSavedRows();
      toast('Skill updated locally', 'info');
    }
  }

  /* ═══ FILTER / SEARCH ═══ */
  _applyFilter(filter, search) {
    if (filter != null) {
      this._activeFilter = filter;
      document.querySelectorAll('.f-btn').forEach(b => b.classList.toggle('active', b.dataset.filter === filter));
    }
    const af   = this._activeFilter;
    const term = search !== undefined ? search.toLowerCase() : document.getElementById('tableSearch').value.toLowerCase();
    document.querySelectorAll('#valBody tr').forEach(tr => {
      const mf = af === 'all' || tr.dataset.status === af;
      const ms = !term || tr.dataset.search?.includes(term);
      tr.style.display = mf && ms ? '' : 'none';
    });
    this._syncMasterChk();
  }

  _isVisible(rowNum) {
    const tr = document.querySelector(`#valBody tr[data-row-num="${rowNum}"]`);
    return tr ? tr.style.display !== 'none' : true;
  }

  _syncCheckboxes() {
    document.querySelectorAll('#valBody .row-chk').forEach(chk => {
      chk.checked = this._selectedRows.has(parseInt(chk.dataset.row));
    });
    this._syncMasterChk();
  }

  _syncMasterChk() {
    const master     = document.getElementById('masterChk');
    if (!master) return;
    const visible    = [...document.querySelectorAll('#valBody tr')].filter(tr => tr.style.display !== 'none');
    const selectable = visible.filter(tr => tr.dataset.status !== 'error');
    const checked    = selectable.filter(tr => this._selectedRows.has(parseInt(tr.dataset.rowNum)));
    master.indeterminate = checked.length > 0 && checked.length < selectable.length;
    master.checked       = selectable.length > 0 && checked.length === selectable.length;
  }

  _updateSelCount() {
    const n = this._selectedRows.size;
    document.getElementById('selCount').textContent       = `${n} selected`;
    document.getElementById('selCreateCount').textContent = n;
    document.getElementById('bulkCreateBtn').disabled     = n === 0;
    this._syncMasterChk();
  }

  /* ═══ BULK IMPORT (to local lists) ═══ */
  async _bulkCreate() {
    const toImport = this.savedRows.filter(r => this._selectedRows.has(r.rowNum));
    if (!toImport.length) { toast('No rows selected', 'error'); return; }

    let importedUnits = 0;
    let importedLessons = 0;

    for (const r of toImport) {
      const { unit, lesson, skill } = r.values || {};
      const subjectId = r.ids?.subject;
      const gradeId = r.ids?.grade;
      const semesterId = r.ids?.semester;

      if (!subjectId || !gradeId || !semesterId) continue;

      const s = this.dm.toTxt.subject?.get(String(subjectId));
      const g = this.dm.toTxt.grade?.get(String(gradeId));
      const sem = this.dm.toTxt.semester?.get(String(semesterId));

      if (!s || !g || !sem) continue;

      if (!this.dm.tree[s]) this.dm.tree[s] = {};
      if (!this.dm.tree[s][g]) this.dm.tree[s][g] = {};
      if (!this.dm.tree[s][g][sem]) this.dm.tree[s][g][sem] = {};

      if (unit && unit.trim()) {
        const uClean = unit.trim();
        if (!this.dm.tree[s][g][sem][uClean]) {
          this.dm.tree[s][g][sem][uClean] = {};
          importedUnits++;
        }
        if (lesson && lesson.trim()) {
          const lClean = lesson.trim();
          if (!this.dm.tree[s][g][sem][uClean][lClean]) {
            this.dm.tree[s][g][sem][uClean][lClean] = new Set();
            importedLessons++;
          }
          if (skill && skill.trim()) {
            this.dm.tree[s][g][sem][uClean][lClean].add(skill.trim());
          }
        }
      }
    }

    // Save to localStorage cache and update Supabase shared cache
    this.dm.hasTree = Object.keys(this.dm.tree).length > 0;
    this.dm.saveCache();
    if (this.dm.hasTree) {
      await this.dm.saveToSupabase();
    }

    toast(`Successfully imported ${importedUnits} Units and ${importedLessons} Lessons!`, 'success', 5000);

    // Delete the imported rows from Supabase saved_rows table
    if (supabaseClient) {
      const idsToDelete = toImport.map(r => r.id).filter(id => id != null);
      if (idsToDelete.length > 0) {
        supabaseClient.from('saved_rows').delete().in('id', idsToDelete).then(({ error }) => {
          if (error) console.error('Failed to delete imported rows from Supabase:', error.message);
        });
      }
    }

    // Remove the imported rows from saved list locally
    const importedNums = new Set(toImport.map(r => r.rowNum));
    this.savedRows = this.savedRows.filter(r => !importedNums.has(r.rowNum));
    this._selectedRows.clear();
    this._persistRows();
    this._renderSavedRows();

    // Switch to Create Ticket tab
    this._switchTab('create');
    this._updateUnitDropdown();
  }

  /* ═══ ADD & EDIT ROW SYSTEM (COLLABORATIVE GRID) ═══ */
  _openAddRowModal() {
    const $ = id => document.getElementById(id);
    $('editRowModalTitle').textContent = 'Add New Row';
    $('editRowId').value = '';
    $('editRowForm').reset();
    
    // Reset Skill to text input field for new entries
    const skillInput = $('eSkill');
    if (skillInput) {
      const skillContainer = skillInput.parentNode;
      skillContainer.innerHTML = `
        <label class="form-label" for="eSkill">Skill</label>
        <input type="text" id="eSkill" class="form-input" placeholder="Skill" value="" />
      `;
    }

    // Set next row number
    const nextNum = this.savedRows.length ? Math.max(...this.savedRows.map(r => r.rowNum)) + 1 : 1;
    $('editRowNum').value = String(nextNum);
    
    $('editRowOverlay').style.display = 'flex';
  }

  _openEditRowModal(id) {
    const $ = id => document.getElementById(id);
    const row = this.savedRows.find(r => r.id === id);
    if (!row) return;

    $('editRowModalTitle').textContent = 'Edit Row';
    $('editRowId').value = String(row.id);
    $('editRowNum').value = String(row.rowNum);
    
    $('eSubject').value = row.values?.subject || '';
    $('eGrade').value = row.values?.grade || '';
    $('eSemester').value = row.values?.semester || '';
    $('eUnit').value = row.values?.unit || '';
    $('eLesson').value = row.values?.lesson || '';
    $('eDomain').value = row.values?.domain || '';
    $('eTopic').value = row.values?.topic || '';
    $('eOutcome').value = row.values?.outcome || '';

    // Dynamic Skill Input or Dropdown based on cached lesson skills
    const s = row.values?.subject;
    const g = row.values?.grade;
    const sem = row.values?.semester;
    const u = row.values?.unit;
    const l = row.values?.lesson;
    const skillsSet = (s && g && sem && u && l) ? this.dm.tree[s]?.[g]?.[sem]?.[u]?.[l] : null;

    const skillInput = $('eSkill');
    if (skillInput) {
      const skillContainer = skillInput.parentNode;

      if (skillsSet && skillsSet.size > 1) {
        const optionsHtml = Array.from(skillsSet).map(sk => {
          const selected = row.values?.skill === sk ? 'selected' : '';
          return `<option value="${sk}" ${selected}>${sk}</option>`;
        }).join('');

        const hasMatch = Array.from(skillsSet).includes(row.values?.skill);
        const customVal = (!row.values?.skill || !hasMatch) ? (row.values?.skill || '') : '';

        skillContainer.innerHTML = `
          <label class="form-label" for="eSkill">Skill</label>
          <select id="eSkill" class="form-select">
            <option value="" disabled ${!row.values?.skill ? 'selected' : ''}>Select skill…</option>
            ${optionsHtml}
            ${customVal ? `<option value="${customVal}" selected>${customVal}</option>` : ''}
            <option value="__custom__">+ Add Custom…</option>
          </select>
        `;

        const eSkillSelect = $('eSkill');
        eSkillSelect.addEventListener('change', e => {
          if (e.target.value === '__custom__') {
            const custom = prompt('Enter custom Skill:');
            if (custom && custom.trim()) {
              const val = custom.trim();
              const opt = document.createElement('option');
              opt.value = val;
              opt.textContent = val;
              eSkillSelect.insertBefore(opt, eSkillSelect.lastChild);
              eSkillSelect.value = val;
            } else {
              eSkillSelect.value = row.values?.skill || '';
            }
          }
        });
      } else {
        skillContainer.innerHTML = `
          <label class="form-label" for="eSkill">Skill</label>
          <input type="text" id="eSkill" class="form-input" placeholder="Skill" value="${row.values?.skill || ''}" />
        `;
      }
    }
    
    $('eItemType').value = row.values?.itemType || '';

    $('editRowOverlay').style.display = 'flex';
  }

  async _saveRowFromModal() {
    const $ = id => document.getElementById(id);
    const id = $('editRowId').value;
    const rowNum = parseInt($('editRowNum').value);

    const values = {
      subject:  $('eSubject').value.trim(),
      grade:    $('eGrade').value.trim(),
      semester: $('eSemester').value.trim(),
      unit:     $('eUnit').value.trim(),
      lesson:   $('eLesson').value.trim(),
      domain:   $('eDomain').value.trim(),
      topic:    $('eTopic').value.trim(),
      outcome:  $('eOutcome').value.trim(),
      skill:    $('eSkill').value.trim(),
      itemType: $('eItemType').value.trim(),
    };

    if (!values.subject || !values.grade || !values.semester) {
      toast('Subject, Grade, and Semester are required', 'error');
      return;
    }

    // Run row validation to dynamically calculate errors/warnings/status
    const mapping = {
      subject: 0, grade: 1, semester: 2, unit: 3, lesson: 4,
      domain: 5, topic: 6, outcome: 7, skill: 8, itemType: 9
    };
    const rowData = [
      values.subject, values.grade, values.semester, values.unit, values.lesson,
      values.domain, values.topic, values.outcome, values.skill, values.itemType
    ];
    
    const validated = this.val.validateRow(rowData, mapping);
    const status = validated.status;
    const notes = validated.errors?.[0] || validated.warnings?.[0] || '';

    if (supabaseClient) {
      const dbRow = {
        row_num: rowNum,
        subject: values.subject,
        grade: values.grade,
        semester: values.semester,
        unit: values.unit,
        lesson: values.lesson,
        domain: values.domain,
        topic: values.topic,
        outcome: values.outcome,
        skill: values.skill,
        item_type: values.itemType,
        status: status,
        notes: notes,
        source_file: id ? (this.savedRows.find(r => r.id === parseInt(id))?.sourceFile || 'Manually Created') : 'Manually Created'
      };

      try {
        if (id) {
          // Edit existing row
          const { error } = await supabaseClient.from('saved_rows').update(dbRow).eq('id', parseInt(id));
          if (error) throw error;
          toast('Row updated successfully!', 'success');
        } else {
          // Add new row
          const { error } = await supabaseClient.from('saved_rows').insert(dbRow);
          if (error) throw error;
          toast('Row added successfully!', 'success');
        }
      } catch (err) {
        console.error('Failed to save row to Supabase:', err.message);
        toast(`Database error: ${err.message}`, 'error');
      }
    } else {
      // Offline fallback
      const localRow = {
        id: id ? parseInt(id) : Date.now(),
        rowNum: rowNum,
        status: status,
        errors: validated.errors,
        warnings: validated.warnings,
        ids: validated.ids,
        values: values,
        sourceFile: id ? (this.savedRows.find(r => r.id === parseInt(id))?.sourceFile || 'Local') : 'Local'
      };

      if (id) {
        const idx = this.savedRows.findIndex(r => r.id === parseInt(id));
        if (idx !== -1) this.savedRows[idx] = localRow;
      } else {
        this.savedRows.push(localRow);
      }
      this.savedRows.sort((a,b) => a.rowNum - b.rowNum);
      this._persistRows();
      this._renderSavedRows();
      toast('Saved locally (Offline)', 'info');
    }

    $('editRowOverlay').style.display = 'none';
  }

  async _deleteRow(id, rowNum) {
    if (!confirm(`Are you sure you want to delete row #${rowNum}?`)) return;

    if (supabaseClient && id != null) {
      try {
        const { error } = await supabaseClient.from('saved_rows').delete().eq('id', id);
        if (error) throw error;
        toast(`Row #${rowNum} deleted successfully!`, 'success');
      } catch (err) {
        console.error('Failed to delete row from Supabase:', err.message);
        toast(`Database error: ${err.message}`, 'error');
      }
    } else {
      // Offline fallback
      this.savedRows = this.savedRows.filter(r => r.rowNum !== rowNum);
      this._selectedRows.delete(rowNum);
      this._persistRows();
      this._renderSavedRows();
      toast(`Row #${rowNum} deleted locally`, 'info');
    }
  }

  /* ═══ LESSONS & UNITS DATABASE VIEW ═══ */
  async _loadLessonsFromSupabase() {
    const tbody = document.getElementById('lessonsBody');
    if (!tbody) return;
    
    if (!supabaseClient) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--terr);padding:24px;">Supabase client not active. Offline mode.</td></tr>`;
      return;
    }
    
    try {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--t3);padding:24px;"><div class="btn-spinner" style="border-color:var(--pri);border-top-color:transparent;margin:0 auto 8px;"></div>Loading data…</td></tr>`;
      
      const { data, error } = await supabaseClient
        .from('hierarchy')
        .select('*')
        .order('subject', { ascending: true })
        .order('grade', { ascending: true })
        .order('semester', { ascending: true })
        .order('unit', { ascending: true })
        .order('lesson', { ascending: true });
        
      if (error) throw error;
      
      if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--t3);padding:24px;">No database data found. Upload sheets to add lessons.</td></tr>`;
        return;
      }
      
      this._renderLessonsRows(data);
    } catch (e) {
      console.error('Failed to load lessons:', e.message);
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--terr);padding:24px;">Failed to load data: ${e.message}</td></tr>`;
    }
  }

  _renderLessonsRows(data) {
    const tbody = document.getElementById('lessonsBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    data.forEach((row, idx) => {
      const tr = document.createElement('tr');
      const searchStr = `${row.subject} ${row.grade} ${row.semester} ${row.unit} ${row.lesson} ${row.skill || ''}`.toLowerCase();
      tr.dataset.search = searchStr;
      
      tr.innerHTML = `
        <td class="td-num">${idx + 1}</td>
        <td>${row.subject || '—'}</td>
        <td>${row.grade || '—'}</td>
        <td>${row.semester || '—'}</td>
        <td title="${row.unit || ''}">${truncate(row.unit, 24)}</td>
        <td title="${row.lesson || ''}">${truncate(row.lesson, 24)}</td>
        <td title="${row.skill || ''}">${truncate(row.skill, 24)}</td>
        <td style="text-align: center;">
          <button class="action-icon-btn btn-delete-hierarchy" title="Delete entry">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>
        </td>
      `;
      
      tr.querySelector('.btn-delete-hierarchy').addEventListener('click', e => {
        e.stopPropagation();
        this._deleteHierarchyEntry(row.id, row.subject, row.grade, row.semester, row.unit, row.lesson, row.skill);
      });
      
      tbody.appendChild(tr);
    });

    // Reset search query input if populated
    const term = document.getElementById('lessonsSearch').value.toLowerCase().trim();
    if (term) {
      document.querySelectorAll('#lessonsBody tr').forEach(tr => {
        const ms = tr.dataset.search?.includes(term);
        tr.style.display = ms ? '' : 'none';
      });
    }
  }

  async _deleteHierarchyEntry(id, subject, grade, semester, unit, lesson, skill) {
    if (!confirm('Are you sure you want to delete this lesson/unit entry from the database? This will remove it from the dropdown choices.')) return;
    
    if (supabaseClient && id != null) {
      try {
        const { error } = await supabaseClient.from('hierarchy').delete().eq('id', id);
        if (error) throw error;
        toast('Entry deleted successfully!', 'success');
        
        // Remove locally from tree
        if (this.dm && this.dm.tree[subject]?.[grade]?.[semester]?.[unit]) {
          const lessonsMap = this.dm.tree[subject][grade][semester][unit];
          if (lessonsMap[lesson]) {
            if (skill) {
              lessonsMap[lesson].delete(skill);
              if (lessonsMap[lesson].size === 0) {
                delete lessonsMap[lesson];
              }
            } else {
              delete lessonsMap[lesson];
            }
            if (Object.keys(lessonsMap).length === 0) {
              delete this.dm.tree[subject][grade][semester][unit];
            }
          }
          this.dm.saveCache();
        }
        
        // Refresh UI table list
        this._loadLessonsFromSupabase();
      } catch (err) {
        console.error('Failed to delete entry from Supabase:', err.message);
        toast(`Error: ${err.message}`, 'error');
      }
    }
  }

  async _clearAllLessons() {
    if (!confirm('Are you sure you want to delete ALL lessons, units, and skills from the database? This cannot be undone.')) return;
    const btn = document.getElementById('clearLessonsBtn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<div class="btn-spinner" style="border-color:var(--err);border-top-color:transparent;display:inline-block;width:12px;height:12px;margin-right:6px;"></div> Clearing…`;
    }
    try {
      if (supabaseClient) {
        const { error } = await supabaseClient.from('hierarchy').delete().neq('id', 0);
        if (error) throw error;
      }
      if (this.dm) {
        this.dm.tree = {};
        this.dm.hasTree = false;
        this.dm.itemCount = 0;
        this.dm.saveCache();
      }
      toast('All lessons cleared from database', 'success');
      await this._loadLessonsFromSupabase();
      this._updateUnitDropdown();
    } catch (e) {
      console.error('Failed to clear lessons:', e.message);
      toast(`Error: ${e.message}`, 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg> Clear All Lessons`;
      }
    }
  }

  async _handleDeleteFromSheet(file) {
    if (!supabaseClient) {
      toast('Supabase client not active. Offline mode.', 'error');
      return;
    }
    const btn = document.getElementById('deleteSheetBtn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<div class="btn-spinner" style="border-color:var(--err);border-top-color:transparent;display:inline-block;width:12px;height:12px;margin-right:6px;"></div> Parsing…`;
    }
    try {
      const { headers, rows } = await ExcelHandler.parse(file);
      const mapping = this._autoMap(headers);
      
      const getVal = (row, key) => {
        const idx = mapping[key];
        return idx != null ? String(row[idx] ?? '').trim() : '';
      };

      const sheetRows = rows.map(row => ({
        subject: getVal(row, 'subject'),
        grade: getVal(row, 'grade'),
        semester: getVal(row, 'semester'),
        unit: getVal(row, 'unit'),
        lesson: getVal(row, 'lesson'),
        skill: getVal(row, 'skill')
      })).filter(r => r.subject && r.grade && r.semester);

      if (sheetRows.length === 0) {
        toast('No valid rows with Subject, Grade, and Semester found in sheet.', 'error');
        return;
      }

      if (btn) {
        btn.innerHTML = `<div class="btn-spinner" style="border-color:var(--err);border-top-color:transparent;display:inline-block;width:12px;height:12px;margin-right:6px;"></div> Comparing…`;
      }

      const { data: dbRecords, error: fetchErr } = await supabaseClient.from('hierarchy').select('*');
      if (fetchErr) throw fetchErr;

      if (!dbRecords || dbRecords.length === 0) {
        toast('No taxonomy records found in database to delete.', 'info');
        return;
      }

      const matchedIds = [];
      const matchedRecords = [];

      for (const rec of dbRecords) {
        const hasMatch = sheetRows.some(sr => {
          const subjectMatch = sr.subject.toLowerCase() === (rec.subject || '').toLowerCase();
          const gradeMatch = sr.grade.toLowerCase() === (rec.grade || '').toLowerCase();
          
          const semA = sr.semester.toLowerCase();
          const semB = (rec.semester || '').toLowerCase();
          const semesterMatch = semA === semB || 
                                (SEMESTER_ALIASES[semA] != null && SEMESTER_ALIASES[semA] === SEMESTER_ALIASES[semB]) ||
                                (SEMESTER_ALIASES[semA] != null && String(SEMESTER_ALIASES[semA]) === semB) ||
                                (SEMESTER_ALIASES[semB] != null && String(SEMESTER_ALIASES[semB]) === semA);

          const unitMatch = sr.unit.toLowerCase() === (rec.unit || '').toLowerCase();
          const lessonMatch = sr.lesson.toLowerCase() === (rec.lesson || '').toLowerCase();
          const skillMatch = sr.skill.toLowerCase() === (rec.skill || '').toLowerCase();

          return subjectMatch && gradeMatch && semesterMatch && unitMatch && lessonMatch && skillMatch;
        });

        if (hasMatch) {
          matchedIds.push(rec.id);
          matchedRecords.push(rec);
        }
      }

      if (matchedIds.length === 0) {
        toast('No matching database records found for the rows in this sheet.', 'info');
        return;
      }

      if (!confirm(`Found ${matchedIds.length} matching entries in the database. Are you sure you want to delete them?`)) {
        return;
      }

      if (btn) {
        btn.innerHTML = `<div class="btn-spinner" style="border-color:var(--err);border-top-color:transparent;display:inline-block;width:12px;height:12px;margin-right:6px;"></div> Deleting…`;
      }

      const { error: deleteErr } = await supabaseClient.from('hierarchy').delete().in('id', matchedIds);
      if (deleteErr) throw deleteErr;

      if (this.dm) {
        for (const rec of matchedRecords) {
          const subject = rec.subject;
          const grade = rec.grade;
          const semester = rec.semester;
          const unit = rec.unit;
          const lesson = rec.lesson;
          const skill = rec.skill;

          if (this.dm.tree[subject]?.[grade]?.[semester]?.[unit]) {
            const lessonsMap = this.dm.tree[subject][grade][semester][unit];
            if (lessonsMap[lesson]) {
              if (skill) {
                lessonsMap[lesson].delete(skill);
                if (lessonsMap[lesson].size === 0) {
                  delete lessonsMap[lesson];
                }
              } else {
                delete lessonsMap[lesson];
              }
              if (Object.keys(lessonsMap).length === 0) {
                delete this.dm.tree[subject][grade][semester][unit];
              }
            }
          }
        }
        this.dm.saveCache();
      }

      toast(`Successfully deleted ${matchedIds.length} matching entries!`, 'success');
      await this._loadLessonsFromSupabase();
      this._updateUnitDropdown();

    } catch (e) {
      console.error('Failed to delete entries from sheet:', e.message);
      toast(`Error: ${e.message}`, 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> Delete from Sheet`;
      }
    }
  }

  /* ═══ SUBMIT SCHEDULE LOGIC ═══ */
  async _submitSchedule() {
    const $ = id => document.getElementById(id);
    const selectedTime = $('fModalScheduleTime').value;
    if (!selectedTime) {
      toast('Please select a date and time.', 'error');
      return;
    }
    const scheduleDate = new Date(selectedTime);
    if (scheduleDate <= new Date()) {
      toast('Please choose a future date and time.', 'error');
      return;
    }

    const isoTime = scheduleDate.toISOString();
    $('scheduleModalOverlay').style.display = 'none';

    if (this._schedulingSource === 'single') {
      const values = {
        subject:  $('fSubject').value ? ($('fSubject').options[$('fSubject').selectedIndex]?.text || '') : '',
        grade:    $('fGrade').value ? ($('fGrade').options[$('fGrade').selectedIndex]?.text || '') : '',
        semester: $('fSemester').value ? ($('fSemester').options[$('fSemester').selectedIndex]?.text || '') : '',
        unit:     $('fUnit').value.trim(),
        lesson:   $('fLesson').value.trim(),
        domain:   $('fDomain').value.trim(),
        topic:    $('fTopic').value.trim(),
        outcome:  $('fOutcome').value.trim(),
        skill:    $('fSkill').value.trim(),
      };

      const checkedChks = Array.from(document.querySelectorAll('.f-item-type-chk:checked'));
      const checkedTypes = checkedChks.map(c => ({
        id: parseInt(c.value),
        text: c.dataset.text
      }));

      const job = {
        scheduled_at: isoTime,
        status: 'pending',
        subject: values.subject,
        grade: values.grade,
        semester: values.semester,
        unit: values.unit,
        lesson: values.lesson,
        domain: values.domain,
        topic: values.topic,
        outcome: values.outcome,
        skill: values.skill,
        item_types: checkedTypes,
        notes: '',
        temp_id: Math.random().toString(36).substr(2, 9)
      };

      try {
        if (this.useDBScheduled && supabaseClient) {
          // In DB mode, we don't send temp_id
          const dbJob = { ...job };
          delete dbJob.temp_id;
          const { error } = await supabaseClient.from('scheduled_tickets').insert(dbJob);
          if (error) throw error;
        } else {
          const cached = localStorage.getItem('btx_scheduled_tickets');
          const jobs = cached ? JSON.parse(cached) : [];
          jobs.push(job);
          localStorage.setItem('btx_scheduled_tickets', JSON.stringify(jobs));
        }
        toast('Ticket scheduled successfully!', 'success');
        this._clearForm();
        await this._loadScheduledTickets();
        this._switchTab('scheduled');
      } catch (e) {
        console.error('Failed to save schedule:', e.message);
        toast(`Failed to schedule: ${e.message}`, 'error');
      }
    } else if (this._schedulingSource === 'bulk') {
      const toSchedule = this.savedRows.filter(r => this._selectedRows.has(r.rowNum));
      const jobs = toSchedule.map(r => {
        const itemType = r.values?.itemType || '';
        const resolvedItemTypeId = this.dm.resolveId('itemType', itemType);
        const itemTypesArray = resolvedItemTypeId ? [{ id: resolvedItemTypeId, text: itemType }] : [];

        const jobItem = {
          scheduled_at: isoTime,
          status: 'pending',
          subject: r.values?.subject || '',
          grade: r.values?.grade || '',
          semester: r.values?.semester || '',
          unit: r.values?.unit || '',
          lesson: r.values?.lesson || '',
          domain: r.values?.domain || '',
          topic: r.values?.topic || '',
          outcome: r.values?.outcome || '',
          skill: r.values?.skill || '',
          item_types: itemTypesArray,
          notes: '',
          temp_id: Math.random().toString(36).substr(2, 9)
        };
        
        if (this.useDBScheduled) {
          delete jobItem.temp_id;
        }
        return jobItem;
      });

      try {
        if (this.useDBScheduled && supabaseClient) {
          const { error } = await supabaseClient.from('scheduled_tickets').insert(jobs);
          if (error) throw error;
        } else {
          const cached = localStorage.getItem('btx_scheduled_tickets');
          const currentJobs = cached ? JSON.parse(cached) : [];
          currentJobs.push(...jobs);
          localStorage.setItem('btx_scheduled_tickets', JSON.stringify(currentJobs));
        }

        if (supabaseClient) {
          const idsToDelete = toSchedule.map(r => r.id).filter(id => id != null);
          if (idsToDelete.length > 0) {
            await supabaseClient.from('saved_rows').delete().in('id', idsToDelete);
          }
        }
        const scheduledNums = new Set(toSchedule.map(r => r.rowNum));
        this.savedRows = this.savedRows.filter(r => !scheduledNums.has(r.rowNum));
        this._selectedRows.clear();
        this._persistRows();
        this._renderSavedRows();

        toast(`Scheduled ${jobs.length} row(s) successfully!`, 'success');
        await this._loadScheduledTickets();
        this._switchTab('scheduled');
      } catch (e) {
        console.error('Failed to schedule bulk rows:', e.message);
        toast(`Failed to schedule bulk: ${e.message}`, 'error');
      }
    }
  }
}

/* ═══ BOOT ═══ */
const app = new App();
app.init();
