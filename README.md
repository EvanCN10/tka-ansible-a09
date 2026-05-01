# TKA 2026 — Praktikum Modul 3 Ansible

Repositori ini berisi hasil pengerjaan **Praktikan 1** yang sudah selesai, dan panduan untuk **Praktikan 2 dan 3** agar bisa langsung melanjutkan tanpa perlu setup dari awal.

---

## Struktur Repositori Saat Ini (Hasil Praktikan 1)

```
ansible-praktikum/
├── ansible.cfg
├── inventory.yml
├── site.yml
└── roles/
    └── docker_engine/
        └── tasks/
            └── main.yml
```

---

## Apa yang Sudah Dikerjakan Praktikan 1

- Membuat 2 node menggunakan Docker container (pengganti Multipass karena keterbatasan jaringan)
- Membuat `inventory.yml` dengan 2 group: `backend` (node1) dan `frontend` (node2)
- Membuat role `docker_engine` untuk install Docker Engine otomatis via Ansible
- Menjalankan playbook ke semua node — Docker berhasil terinstall di node1 dan node2
- Setup firewall UFW dengan hanya port 22 yang terbuka
- Verifikasi `docker run hello-world` berhasil di kedua node

---

## Syarat Sebelum Melanjutkan

Sebelum Praktikan 2 atau 3 mulai, pastikan laptop sudah memiliki:

- **Windows** dengan WSL (Ubuntu) terinstall
- **Docker Desktop** terinstall dan sedang berjalan
- **Ansible** terinstall di dalam WSL
- **Git** terinstall di WSL

---

## Cara Clone dan Setup Ulang dari Awal (Untuk Praktikan 2 & 3)

### Langkah 1 — Clone Repositori

Buka WSL, lalu jalankan:

```bash
git clone https://github.com/[username]/[nama-repo].git
cd ansible-praktikum
```

---

### Langkah 2 — Generate SSH Key (Kalau Belum Ada)

```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""
```

Kalau sudah pernah generate sebelumnya dan file `~/.ssh/id_rsa` sudah ada, lewati langkah ini.

---

### Langkah 3 — Buat Ulang Container node1 dan node2

Container tidak ikut tersimpan di Git, jadi harus dibuat ulang. Jalankan perintah ini di WSL:

```bash
docker run -d \
  --name node1 \
  --privileged \
  --cgroupns=host \
  -v /sys/fs/cgroup:/sys/fs/cgroup:rw \
  -p 2221:22 \
  ubuntu:22.04 \
  sleep infinity

docker run -d \
  --name node2 \
  --privileged \
  --cgroupns=host \
  -v /sys/fs/cgroup:/sys/fs/cgroup:rw \
  -p 2222:22 \
  ubuntu:22.04 \
  sleep infinity
```

Penjelasan port:
- node1 bisa diakses via `localhost:2221`
- node2 bisa diakses via `localhost:2222`

---

### Langkah 4 — Setup SSH di node1

Jalankan satu per satu:

```bash
docker exec node1 bash -c "apt update && apt install -y openssh-server sudo"
docker exec node1 bash -c "useradd -m -s /bin/bash ubuntu 2>/dev/null || true"
docker exec node1 bash -c "echo 'ubuntu ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers"
docker exec node1 bash -c "mkdir -p /home/ubuntu/.ssh && chmod 700 /home/ubuntu/.ssh"
cat ~/.ssh/id_rsa.pub | docker exec -i node1 bash -c "cat >> /home/ubuntu/.ssh/authorized_keys && chmod 600 /home/ubuntu/.ssh/authorized_keys && chown -R ubuntu:ubuntu /home/ubuntu/.ssh"
docker exec node1 bash -c "mkdir -p /run/sshd && /usr/sbin/sshd"
```

---

### Langkah 5 — Setup SSH di node2

```bash
docker exec node2 bash -c "apt update && apt install -y openssh-server sudo"
docker exec node2 bash -c "useradd -m -s /bin/bash ubuntu 2>/dev/null || true"
docker exec node2 bash -c "echo 'ubuntu ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers"
docker exec node2 bash -c "mkdir -p /home/ubuntu/.ssh && chmod 700 /home/ubuntu/.ssh"
cat ~/.ssh/id_rsa.pub | docker exec -i node2 bash -c "cat >> /home/ubuntu/.ssh/authorized_keys && chmod 600 /home/ubuntu/.ssh/authorized_keys && chown -R ubuntu:ubuntu /home/ubuntu/.ssh"
docker exec node2 bash -c "mkdir -p /run/sshd && /usr/sbin/sshd"
```

---

### Langkah 6 — Test SSH Manual

```bash
ssh -p 2221 ubuntu@127.0.0.1
exit

ssh -p 2222 ubuntu@127.0.0.1
exit
```

Kalau berhasil masuk ke kedua node, lanjut ke langkah berikutnya.

---

### Langkah 7 — Verifikasi Ansible Bisa Ping Semua Node

```bash
ansible all -m ping
```

Output yang diharapkan:

```
node1 | SUCCESS => { "ping": "pong" }
node2 | SUCCESS => { "ping": "pong" }
```

---

### Langkah 8 — Jalankan Playbook Utama (Install Docker di Semua Node)

```bash
ansible-playbook site.yml
```

Tunggu sampai selesai. Proses ini membutuhkan waktu beberapa menit karena Docker perlu diinstall di dalam kedua node.

Output yang diharapkan di akhir:

```
PLAY RECAP
node1 : ok=14  changed=8  failed=0
node2 : ok=14  changed=8  failed=0
```

---

### Langkah 9 — Verifikasi Docker Berjalan di Kedua Node

```bash
ssh -p 2221 ubuntu@127.0.0.1
docker run hello-world
exit

ssh -p 2222 ubuntu@127.0.0.1
docker run hello-world
exit
```

Kalau muncul `Hello from Docker!` di kedua node, setup Praktikan 1 sudah berhasil direproduksi.

---

## Informasi Penting untuk Praktikan 2 (Backend)

- Node yang digunakan: **node1** (group `backend` di inventory)
- SSH ke node1: `ssh -p 2221 ubuntu@127.0.0.1`
- Docker sudah terinstall dan siap dipakai
- Tambahkan role baru di folder `roles/` dengan nama misalnya `backend_deploy`
- Tambahkan variabel di `group_vars/backend/` untuk `db_name`, `db_username`, `backend_port`, `db_password`, `jwt_secret`
- Setelah role selesai, **modifikasi `site.yml`** dengan menambahkan play baru khusus group `backend`
- Jangan ubah play yang sudah ada (install docker_engine) agar tidak merusak pekerjaan Praktikan 1

---

## Informasi Penting untuk Praktikan 3 (Frontend)

- Node yang digunakan: **node2** (group `frontend` di inventory)
- SSH ke node2: `ssh -p 2222 ubuntu@127.0.0.1`
- Docker sudah terinstall dan siap dipakai
- Tambahkan role baru di folder `roles/` dengan nama misalnya `frontend_deploy`
- Tambahkan variabel di `group_vars/frontend/` untuk `frontend_port` dan `backend_url`
- `backend_url` menggunakan template berdasarkan Ansible inventory — **jangan hardcode IP**
- Setelah role selesai, **modifikasi `site.yml`** dengan menambahkan play baru khusus group `frontend`
- Tunggu Praktikan 2 selesai deploy backend sebelum mengisi `backend_url`

---

## Catatan Penting

- **Jangan hapus atau ubah** file `ansible.cfg`, `inventory.yml`, `site.yml`, dan `roles/docker_engine/` yang sudah ada
- Setiap kali laptop restart, container node1 dan node2 perlu dijalankan ulang dengan `docker start node1 node2` dan SSH server perlu dijalankan ulang dengan:
  ```bash
  docker exec node1 bash -c "mkdir -p /run/sshd && /usr/sbin/sshd"
  docker exec node2 bash -c "mkdir -p /run/sshd && /usr/sbin/sshd"
  ```
- Pastikan Docker Desktop dalam kondisi **running** sebelum menjalankan perintah apapun

---

## Cara Push ke GitHub (Setelah Selesai Mengerjakan Bagian Masing-masing)

```bash
git add .
git commit -m "Praktikan [1/2/3]: [deskripsi singkat apa yang dikerjakan]"
git push origin main
```
