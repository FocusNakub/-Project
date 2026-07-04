# Buang Luang Bap Production Portal V2.0

เว็บ Production Portal แบบ Online Sync ด้วย Firebase

## รหัสเข้า Control Center
- Admin: `admin123`
- Editor: `editor123`

## วิธีลง GitHub Pages
1. อัปโหลดทุกไฟล์ในโฟลเดอร์นี้ขึ้น GitHub repository
2. ไปที่ Settings > Pages
3. เลือก Deploy from branch และเลือก branch main / root
4. รอ 1–3 นาที แล้วเปิดลิงก์ GitHub Pages

## Firebase ที่ใช้
โปรเจกต์: `horror-project-fc3a3`

ต้องเปิดบริการนี้ใน Firebase Console:
1. Authentication > Sign-in method > Anonymous > Enable
2. Firestore Database > Create database
3. Storage > Create bucket

## Firestore Rules สำหรับทดสอบ
ใช้เฉพาะช่วงทดสอบเท่านั้น

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Storage Rules สำหรับทดสอบ

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

หมายเหตุ: ระบบนี้ใช้รหัส Admin/Editor ในหน้าเว็บเพื่อความสะดวกในการทำงานกองถ่าย ถ้าจะใช้จริงแบบปลอดภัยควรย้ายไปใช้ Firebase Authentication แบบ Email/Password และ custom roles
