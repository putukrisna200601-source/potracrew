// assets/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    // Format input honor dengan separator ribuan (titik)
    const expectedHonorInput = document.getElementById('expectedHonor');
    if (expectedHonorInput) {
        expectedHonorInput.addEventListener('input', function (e) {
            // Hapus karakter non-digit
            let value = this.value.replace(/\D/g, '');
            // Format angka dengan ribuan separator
            if (value !== '') {
                value = parseInt(value, 10).toLocaleString('id-ID');
            }
            this.value = value;
        });
    }

    // 1. Intersection Observer for Fade-In Animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Animate only once
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.fade-in-up');
    animatedElements.forEach(el => observer.observe(el));

    // 2. Sticky Navbar Blur & Shadow on Scroll
    const navbar = document.querySelector('.navbar-custom');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)';
            navbar.style.padding = '0.5rem 0';
        } else {
            navbar.style.boxShadow = 'none';
            navbar.style.padding = '1rem 0';
        }
    });

    // Smooth scrolling and offset are now natively handled by CSS (scroll-behavior and scroll-padding-top)

    // 4. Registration Form Logic (Multi-step)
    const form = document.getElementById('registrationForm');
    if (form) {
        const steps = Array.from(document.querySelectorAll('.form-step'));
        const nextBtns = document.querySelectorAll('.btn-next');
        const prevBtns = document.querySelectorAll('.btn-prev');
        const steppers = document.querySelectorAll('.stepper-item');
        let currentStep = 0;

        // Validation Patterns
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^[0-9]+$/;

        // Auto calculate age
        const dobInput = document.getElementById('dob');
        const ageInput = document.getElementById('age');
        if (dobInput && ageInput) {
            dobInput.addEventListener('change', function() {
                const dob = new Date(this.value);
                const today = new Date();
                if (dob > today) {
                    this.classList.add('is-invalid');
                    ageInput.value = '';
                    return;
                }
                this.classList.remove('is-invalid');
                let age = today.getFullYear() - dob.getFullYear();
                const m = today.getMonth() - dob.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
                    age--;
                }
                ageInput.value = age + ' Tahun';
            });
        }

        // File Upload Logic
        const cvFileInput = document.getElementById('cvFile');
        const customFileUpload = document.querySelector('.custom-file-upload');
        const uploadPlaceholder = document.getElementById('uploadPlaceholder');
        const uploadSuccess = document.getElementById('uploadSuccess');
        const fileNameDisplay = document.getElementById('fileNameDisplay');
        const fileSizeDisplay = document.getElementById('fileSizeDisplay');
        const fileError = document.getElementById('fileError');

        if (cvFileInput) {
            cvFileInput.addEventListener('change', function() {
                const file = this.files[0];
                handleFileUpload(file);
            });

            // Drag and Drop
            customFileUpload.addEventListener('dragover', (e) => {
                e.preventDefault();
                customFileUpload.classList.add('border-primary', 'bg-light');
            });
            customFileUpload.addEventListener('dragleave', () => {
                customFileUpload.classList.remove('border-primary', 'bg-light');
            });
            customFileUpload.addEventListener('drop', (e) => {
                e.preventDefault();
                customFileUpload.classList.remove('border-primary', 'bg-light');
                if (e.dataTransfer.files.length > 0) {
                    cvFileInput.files = e.dataTransfer.files;
                    handleFileUpload(e.dataTransfer.files[0]);
                }
            });
        }

        function handleFileUpload(file) {
            if (!file) return;
            
            // Validate PDF
            if (file.type !== 'application/pdf') {
                fileError.textContent = 'Harap unggah file dengan format .PDF';
                fileError.classList.add('d-block');
                cvFileInput.value = '';
                uploadPlaceholder.classList.remove('d-none');
                uploadSuccess.classList.add('d-none');
                return;
            }

            // Validate Size (Max 20MB)
            if (file.size > 20 * 1024 * 1024) {
                fileError.textContent = 'Ukuran file maksimal 20 MB';
                fileError.classList.add('d-block');
                cvFileInput.value = '';
                uploadPlaceholder.classList.remove('d-none');
                uploadSuccess.classList.add('d-none');
                return;
            }

            fileError.classList.remove('d-block');
            fileNameDisplay.textContent = file.name;
            fileSizeDisplay.textContent = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
            
            uploadPlaceholder.classList.add('d-none');
            uploadSuccess.classList.remove('d-none');
            customFileUpload.classList.remove('border-dashed');
            customFileUpload.classList.add('border-success', 'bg-success', 'bg-opacity-10');
        }

        // Validate Step
        function validateStep(stepIndex) {
            const stepElement = steps[stepIndex];
            const inputs = stepElement.querySelectorAll('input[required], select[required], textarea[required]');
            let isValid = true;

            inputs.forEach(input => {
                // Radio buttons special handling
                if (input.type === 'radio') {
                    const group = stepElement.querySelectorAll(`input[name="${input.name}"]`);
                    let isChecked = false;
                    group.forEach(radio => { if (radio.checked) isChecked = true; });
                    if (!isChecked) {
                        isValid = false;
                        if (input.name === 'gender') document.getElementById('genderError').classList.add('d-block');
                    } else {
                        if (input.name === 'gender') document.getElementById('genderError').classList.remove('d-block');
                    }
                    return;
                }

                if (!input.value.trim()) {
                    isValid = false;
                    input.classList.add('is-invalid');
                } else {
                    // Specific validations
                    if (input.type === 'email' && !emailRegex.test(input.value)) {
                        isValid = false;
                        input.classList.add('is-invalid');
                    } else if (input.type === 'tel' && !phoneRegex.test(input.value.replace(/[^0-9]/g, ''))) {
                        isValid = false;
                        input.classList.add('is-invalid');
                    } else {
                        input.classList.remove('is-invalid');
                    }
                }
            });

            // CV validation on step 3
            if (stepIndex === 2 && !cvFileInput.files.length) {
                isValid = false;
                fileError.textContent = 'Harap unggah CV (PDF) maksimal 20 MB.';
                fileError.classList.add('d-block');
            }

            return isValid;
        }

        // Populate Summary Step
        function populateSummary() {
            document.getElementById('sumName').textContent = document.getElementById('fullName').value;
            
            const dobVal = document.getElementById('dob').value;
            const ageVal = document.getElementById('age').value;
            document.getElementById('sumAge').textContent = dobVal + (ageVal ? ` (${ageVal})` : '');
            
            document.getElementById('sumContact').textContent = `${document.getElementById('whatsapp').value} | ${document.getElementById('email').value}`;
            
            const expEvent = document.querySelector('input[name="expEvent"]:checked')?.value || '-';
            const expPhoto = document.querySelector('input[name="expPhoto"]:checked')?.value || '-';
            document.getElementById('sumEvent').textContent = `Event: ${expEvent} | Photobooth: ${expPhoto}`;
            
            const checkedSkills = Array.from(document.querySelectorAll('input[name="skills"]:checked')).map(el => el.value);
            document.getElementById('sumSkills').textContent = checkedSkills.length ? checkedSkills.join(', ') : '-';
            
            const veh = document.querySelector('input[name="vehicle"]:checked')?.value || '-';
            const ns = document.querySelector('input[name="nightShift"]:checked')?.value || '-';
            const wk = document.querySelector('input[name="weekend"]:checked')?.value || '-';
            const ot = document.querySelector('input[name="outOfTown"]:checked')?.value || '-';
            document.getElementById('sumAvail').textContent = `Kendaraan: ${veh} | Malam: ${ns} | Akhir Pekan: ${wk} | Luar Kota: ${ot}`;
            
            if (cvFileInput.files.length > 0) {
                document.getElementById('sumCv').textContent = cvFileInput.files[0].name;
            }
        }

        // Navigation
        nextBtns.forEach((btn) => {
            btn.addEventListener('click', () => {
                if (validateStep(currentStep)) {
                    steps[currentStep].classList.remove('form-step-active');
                    steps[currentStep].classList.add('d-none');
                    
                    if (currentStep === 2) {
                        populateSummary();
                    }
                    
                    currentStep++;
                    steps[currentStep].classList.remove('d-none');
                    // Small delay to trigger animation
                    setTimeout(() => {
                        steps[currentStep].classList.add('form-step-active');
                    }, 50);
                    
                    updateSteppers();
                }
            });
        });

        prevBtns.forEach((btn) => {
            btn.addEventListener('click', () => {
                steps[currentStep].classList.remove('form-step-active');
                steps[currentStep].classList.add('d-none');
                currentStep--;
                steps[currentStep].classList.remove('d-none');
                setTimeout(() => {
                    steps[currentStep].classList.add('form-step-active');
                }, 50);
                updateSteppers();
            });
        });

        function updateSteppers() {
            steppers.forEach((stepper, index) => {
                if (index < currentStep) {
                    stepper.classList.add('completed');
                    stepper.classList.remove('active');
                } else if (index === currentStep) {
                    stepper.classList.add('active');
                    stepper.classList.remove('completed');
                } else {
                    stepper.classList.remove('active', 'completed');
                }
            });
        }

        // Input change clear invalid
        form.querySelectorAll('input, select, textarea').forEach(input => {
            input.addEventListener('input', () => {
                input.classList.remove('is-invalid');
            });
            input.addEventListener('change', () => {
                input.classList.remove('is-invalid');
            });
        });

        const btnSubmit = document.getElementById('btnSubmit');
        if (btnSubmit) {
            btnSubmit.addEventListener('click', async () => {
                const agreeCheck = document.getElementById('agreeCheck');
                if (agreeCheck && !agreeCheck.checked) {
                    agreeCheck.classList.add('is-invalid');
                    return;
                }
                
                // Prevent Double Submit
                btnSubmit.disabled = true;
                const originalText = btnSubmit.innerHTML;
                btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Memproses...';
                
                try {
                    const formData = new FormData();
                    formData.append('fullName', document.getElementById('fullName').value);
                    formData.append('dob', document.getElementById('dob').value);
                    
                    const genderEl = document.querySelector('input[name="gender"]:checked');
                    formData.append('gender', genderEl ? genderEl.value : '');
                    
                    formData.append('address', document.getElementById('address').value);
                    formData.append('education', document.getElementById('education').value);
                    formData.append('currentJob', document.getElementById('currentJob').value);
                    
                    // Bersihkan titik sebelum dikirim ke API
                    const rawHonor = document.getElementById('expectedHonor').value.replace(/\./g, '');
                    formData.append('expectedHonor', rawHonor);
                    
                    formData.append('whatsapp', document.getElementById('whatsapp').value);
                    formData.append('email', document.getElementById('email').value);
                    formData.append('instagram', document.getElementById('instagram').value);
                    
                    const expEventEl = document.querySelector('input[name="expEvent"]:checked');
                    formData.append('expEvent', expEventEl ? expEventEl.value : 'Tidak');
                    
                    const expPhotoEl = document.querySelector('input[name="expPhoto"]:checked');
                    formData.append('expPhoto', expPhotoEl ? expPhotoEl.value : 'Tidak');
                    
                    // Kumpulkan semua checked skills
                    const skills = [];
                    document.querySelectorAll('input[name="skills"]:checked').forEach(el => {
                        if (el.value === 'Lainnya') {
                            const customSkill = document.getElementById('skillLainnyaInput');
                            if (customSkill && customSkill.value.trim() !== '') {
                                skills.push(customSkill.value.trim());
                            } else {
                                skills.push('Lainnya');
                            }
                        } else {
                            skills.push(el.value);
                        }
                    });
                    
                    formData.append('skills', skills.join(', '));
                    
                    const vehicleEl = document.querySelector('input[name="vehicle"]:checked');
                    formData.append('vehicle', vehicleEl ? vehicleEl.value : 'Tidak');
                    
                    const cameraEl = document.querySelector('input[name="camera"]:checked');
                    formData.append('camera', cameraEl ? cameraEl.value : 'Tidak');
                    
                    const cvFileEl = document.getElementById('cvFile');
                    if (cvFileEl.files.length > 0) {
                        formData.append('cvFile', cvFileEl.files[0]);
                    }
                    
                    const res = await fetch('/api/applicants/register', {
                        method: 'POST',
                        body: formData
                    });
                    
                    const data = await res.json();
                    
                    if (data.success) {
                        // Show success
                        document.getElementById('registrationCard').classList.add('text-center');
                        form.classList.add('d-none');
                        document.querySelector('.stepper-wrapper').classList.add('d-none');
                        document.querySelector('.text-center.mb-5').classList.add('d-none'); // Hide title
                        
                        const successState = document.getElementById('successState');
                        successState.classList.remove('d-none');
                        successState.style.animation = 'fadeIn 0.5s ease-out forwards';
                    } else {
                        throw new Error(data.message || 'Pendaftaran gagal');
                    }
                } catch (error) {
                    console.error(error);
                    if (typeof Swal !== 'undefined') {
                        Swal.fire({
                            title: 'Gagal!',
                            text: error.message || 'Terjadi kesalahan saat mengirim pendaftaran.',
                            icon: 'error',
                            confirmButtonColor: '#0d6efd'
                        });
                    } else {
                        alert('Gagal: ' + error.message);
                    }
                    btnSubmit.disabled = false;
                    btnSubmit.innerHTML = originalText;
                }
            });
        }

        // 5. Form Abandonment Warning
        const homeLinks = document.querySelectorAll('a[href^="index.html"]');
        homeLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                // Check if success state is visible
                const successState = document.getElementById('successState');
                if (successState && !successState.classList.contains('d-none')) {
                    return; // Let them go safely if they already submitted
                }

                e.preventDefault(); // Stop navigation
                const targetUrl = this.getAttribute('href');

                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        title: 'Tinggalkan Pendaftaran?',
                        html: '<p class="text-muted mb-0">Jika kamu kembali ke Beranda, <b>seluruh data pendaftaran yang sudah diisi akan hilang</b>.</p>',
                        icon: 'warning',
                        iconColor: '#f59e0b',
                        showCancelButton: true,
                        confirmButtonText: '<i class="fa-solid fa-arrow-right-from-bracket me-2"></i> Ya, Tinggalkan',
                        cancelButtonText: 'Batal',
                        reverseButtons: true,
                        buttonsStyling: false,
                        customClass: {
                            popup: 'rounded-4 shadow-lg border-0 p-3',
                            title: 'fw-bold fs-3 text-primary mb-2',
                            confirmButton: 'btn btn-danger rounded-pill px-4 py-2 ms-2 fw-medium',
                            cancelButton: 'btn btn-light rounded-pill px-4 py-2 fw-medium text-secondary border-0',
                            htmlContainer: 'mb-4 mt-2'
                        },
                        backdrop: `rgba(17, 24, 39, 0.6)`
                    }).then((result) => {
                        if (result.isConfirmed) {
                            window.location.href = targetUrl;
                        }
                    });
                } else {
                    if (confirm('Apakah kamu yakin mengakhiri sesi ini? Data yang telah diisi akan hilang.')) {
                        window.location.href = targetUrl;
                    }
                }
            });
        });

        // Smooth Page Transition to Admin Portal
        const adminLinks = document.querySelectorAll('.footer-admin-link');
        adminLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const href = this.getAttribute('href');
                document.body.classList.add('page-exit');
                setTimeout(() => {
                    window.location.href = href;
                }, 350);
            });
        });
    }

    // ==========================================================================
    // Phase 5: Data Pelamar Filtering & Sorting
    // ==========================================================================
    const searchPelamar = document.getElementById('searchPelamar');
    const filterStatus = document.getElementById('filterStatus');
    const filterPendidikan = document.getElementById('filterPendidikan');
    const sortPelamar = document.getElementById('sortPelamar');
    const btnResetFilter = document.getElementById('btnResetFilter');
    const tableBody = document.getElementById('tablePelamarBody');
    const quickFilters = document.querySelectorAll('.quick-filters .filter-pill');

    if (tableBody) {
        let rows = Array.from(tableBody.querySelectorAll('tr'));
        let originalOrder = [...rows];

        function applyFilters() {
            const searchTerm = searchPelamar ? searchPelamar.value.toLowerCase() : '';
            const statusTerm = filterStatus ? filterStatus.value.toLowerCase() : '';
            const pendidikanTerm = filterPendidikan ? filterPendidikan.value.toLowerCase() : '';

            let visibleRows = [];

            rows.forEach(row => {
                const nameStr = row.querySelector('td:nth-child(2) .fw-semibold')?.innerText.toLowerCase() || '';
                const contactStr = row.querySelector('td:nth-child(2) .text-muted')?.innerText.toLowerCase() || '';
                const eduStr = row.querySelector('td:nth-child(3) .text-muted')?.innerText.toLowerCase() || '';
                const statusBadge = row.querySelector('td:nth-child(6) .badge')?.innerText.toLowerCase() || '';

                const matchesSearch = nameStr.includes(searchTerm) || contactStr.includes(searchTerm);
                const matchesStatus = statusTerm === '' || statusBadge.includes(statusTerm);
                let matchesEdu = true;
                if (pendidikanTerm === 'sma') matchesEdu = eduStr.includes('sma') || eduStr.includes('smk');
                else if (pendidikanTerm === 'd3') matchesEdu = eduStr.includes('d3');
                else if (pendidikanTerm === 's1') matchesEdu = eduStr.includes('s1');

                if (matchesSearch && matchesStatus && matchesEdu) {
                    row.style.display = '';
                    visibleRows.push(row);
                } else {
                    row.style.display = 'none';
                }
            });

            // Update row numbers for visible rows
            visibleRows.forEach((row, index) => {
                const noCell = row.querySelector('td:nth-child(1)');
                if(noCell) noCell.innerText = index + 1;
            });

            applySorting(visibleRows);
        }

        function parseDate(dateStr) {
            // example: "24 Jul 2026"
            return new Date(dateStr).getTime();
        }

        function parseCurrency(currStr) {
            // example: "Rp200.000"
            return parseInt(currStr.replace(/[^0-9]/g, '')) || 0;
        }

        function applySorting(visibleRows) {
            if (!sortPelamar) return;
            const sortVal = sortPelamar.value;

            if (sortVal === '') {
                // Return to original order
                visibleRows.sort((a, b) => {
                    return originalOrder.indexOf(a) - originalOrder.indexOf(b);
                });
            } else if (sortVal === 'date_desc') {
                visibleRows.sort((a, b) => {
                    const dateA = a.querySelector('td:nth-child(5) .text-sm')?.childNodes[0]?.nodeValue?.trim() || '';
                    const dateB = b.querySelector('td:nth-child(5) .text-sm')?.childNodes[0]?.nodeValue?.trim() || '';
                    return parseDate(dateB) - parseDate(dateA);
                });
            } else if (sortVal === 'honor_asc') {
                visibleRows.sort((a, b) => {
                    const honorA = a.querySelector('td:nth-child(4)')?.innerText || '';
                    const honorB = b.querySelector('td:nth-child(4)')?.innerText || '';
                    return parseCurrency(honorA) - parseCurrency(honorB);
                });
            } else if (sortVal === 'name_asc') { // default fallback for 'Sort: Nama (A-Z)' if value is '' actually it's empty, but let's handle if it changes
                visibleRows.sort((a, b) => {
                    const nameA = a.querySelector('td:nth-child(2) .fw-semibold')?.innerText.toLowerCase() || '';
                    const nameB = b.querySelector('td:nth-child(2) .fw-semibold')?.innerText.toLowerCase() || '';
                    return nameA.localeCompare(nameB);
                });
            }

            // Re-append to DOM in sorted order
            visibleRows.forEach(row => {
                tableBody.appendChild(row);
            });
            
            // Re-update row numbers after sort
            visibleRows.forEach((row, index) => {
                const noCell = row.querySelector('td:nth-child(1)');
                if(noCell) noCell.innerText = index + 1;
            });
        }

        if (searchPelamar) searchPelamar.addEventListener('input', applyFilters);
        if (filterStatus) filterStatus.addEventListener('change', () => {
            // Sync with Quick Filters UI
            let mappedVal = filterStatus.value;
            quickFilters.forEach(pill => {
                pill.classList.remove('active');
                const pillText = pill.innerText.toLowerCase().trim();
                if(mappedVal === '' && pillText === 'semua') pill.classList.add('active');
                else if(mappedVal === 'baru' && pillText === 'baru') pill.classList.add('active');
                else if(mappedVal === 'administrasi' && pillText === 'seleksi administrasi') pill.classList.add('active');
                else if(mappedVal === 'menunggu wawancara' && pillText === 'menunggu wawancara') pill.classList.add('active');
                else if(mappedVal === 'sudah dinilai' && pillText === 'sudah dinilai') pill.classList.add('active');
                else if(mappedVal === 'direkomendasikan' && pillText === 'direkomendasikan') pill.classList.add('active');
                else if(mappedVal === 'tidak lolos' && pillText === 'tidak lolos') pill.classList.add('active');
            });
            applyFilters();
        });
        if (filterPendidikan) filterPendidikan.addEventListener('change', applyFilters);
        if (sortPelamar) sortPelamar.addEventListener('change', applyFilters);

        if (btnResetFilter) {
            btnResetFilter.addEventListener('click', () => {
                if (searchPelamar) searchPelamar.value = '';
                if (filterStatus) filterStatus.value = '';
                if (filterPendidikan) filterPendidikan.value = '';
                if (sortPelamar) sortPelamar.value = '';
                
                quickFilters.forEach(p => p.classList.remove('active'));
                if(quickFilters.length > 0) quickFilters[0].classList.add('active');
                
                applyFilters();
            });
        }

        // Quick Filters click
        quickFilters.forEach(pill => {
            pill.addEventListener('click', () => {
                quickFilters.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                
                const pillText = pill.innerText.toLowerCase().trim();
                let statusVal = '';
                if(pillText.includes('baru')) statusVal = 'baru';
                else if(pillText.includes('administrasi')) statusVal = 'administrasi';
                else if(pillText.includes('menunggu')) statusVal = 'menunggu wawancara';
                else if(pillText.includes('dinilai')) statusVal = 'sudah dinilai';
                else if(pillText.includes('direkomendasikan')) statusVal = 'direkomendasikan';
                else if(pillText.includes('gagal')) statusVal = 'tidak lolos';

                if (filterStatus) {
                    filterStatus.value = statusVal;
                    applyFilters();
                }
            });
        });

        // Table Actions (Delegation)
        tableBody.addEventListener('click', (e) => {
            const target = e.target.closest('button.action-btn');
            if (!target) return;
            
            const row = target.closest('tr');
            const namaKandidat = row.querySelector('td:nth-child(2) .fw-semibold')?.innerText || 'Kandidat';

            const actionType = target.getAttribute('title');

            if (actionType === 'Penilaian Wawancara') {
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        title: `Penilaian Wawancara`,
                        html: `Masukkan skor wawancara untuk <b>${namaKandidat}</b> (0 - 100):`,
                        input: 'number',
                        inputAttributes: { min: 0, max: 100, step: 1 },
                        showCancelButton: true,
                        confirmButtonText: 'Simpan',
                        cancelButtonText: 'Batal',
                        cancelButtonColor: '#ef4444',
                        customClass: {
                            popup: 'rounded-4 shadow-lg border-0 p-3',
                            title: 'fw-bold fs-4 text-primary mb-2',
                            confirmButton: 'btn btn-primary rounded-pill px-4 py-2 ms-2 fw-medium',
                            cancelButton: 'btn btn-danger text-white rounded-pill px-4 py-2 fw-medium border-0',
                            input: 'form-control form-control-lg text-center mx-auto'
                        }
                    }).then((result) => {
                        if (result.isConfirmed && result.value) {
                            Swal.fire({
                                title: 'Tersimpan!',
                                text: `Skor ${result.value} untuk ${namaKandidat} telah disimpan dalam sistem.`,
                                icon: 'success',
                                confirmButtonColor: '#10b981',
                                customClass: {
                                    popup: 'rounded-4 shadow-lg border-0',
                                    confirmButton: 'btn btn-success rounded-pill px-4 py-2 fw-medium'
                                }
                            });
                        }
                    });
                } else {
                    alert(`Fitur Penilaian Wawancara untuk ${namaKandidat}`);
                }
            } 
            else if (actionType === 'Lihat CV') {
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        title: 'Membuka Dokumen...',
                        text: `Memuat CV milik ${namaKandidat}`,
                        icon: 'info',
                        timer: 1500,
                        showConfirmButton: false,
                        customClass: { popup: 'rounded-4 shadow-lg border-0' }
                    });
                } else {
                    alert(`Membuka CV milik ${namaKandidat}...`);
                }
            }
            else if (actionType === 'Arsipkan') {
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        title: 'Arsipkan Kandidat?',
                        html: `Kandidat <b>${namaKandidat}</b> akan disembunyikan dari daftar aktif.`,
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#ef4444',
                        cancelButtonColor: '#ef4444',
                        confirmButtonText: '<i class="fa-solid fa-box-archive me-2"></i> Ya, Arsipkan',
                        cancelButtonText: 'Batal',
                        customClass: {
                            popup: 'rounded-4 shadow-lg border-0 p-3',
                            title: 'fw-bold fs-4 text-danger mb-2',
                            confirmButton: 'btn btn-dark rounded-pill px-4 py-2 ms-2 fw-medium',
                            cancelButton: 'btn btn-danger text-white rounded-pill px-4 py-2 fw-medium border-0'
                        }
                    }).then((result) => {
                        if (result.isConfirmed) {
                            // Remove from data and DOM
                            const index = originalOrder.indexOf(row);
                            if (index > -1) originalOrder.splice(index, 1);
                            const rowsIndex = rows.indexOf(row);
                            if (rowsIndex > -1) rows.splice(rowsIndex, 1);
                            
                            row.style.transform = 'scale(0.95)';
                            row.style.opacity = '0';
                            row.style.transition = 'all 0.3s ease';
                            
                            setTimeout(() => {
                                row.remove();
                                applyFilters(); // Re-apply to update index numbers
                            }, 300);

                            Swal.fire({
                                title: 'Diarsipkan!',
                                text: 'Data kandidat telah dipindahkan ke arsip.',
                                icon: 'success',
                                confirmButtonColor: '#10b981',
                                timer: 2000,
                                showConfirmButton: false,
                                customClass: { popup: 'rounded-4 shadow-lg border-0' }
                            });
                        }
                    });
                }
            }
        });
    }

    // ==========================================================================
    // Portal Status Lamaran Logic
    // ==========================================================================
    const statusSearchForm = document.getElementById('statusSearchForm');
    const portalFormCard = document.getElementById('portalFormCard');
    const statusResultContainer = document.getElementById('statusResultContainer');
    const portalSkeleton = document.getElementById('portalSkeleton');
    const portalResultContent = document.getElementById('portalResultContent');
    const btnCekStatus = document.getElementById('btnCekStatus');

    if (statusSearchForm) {
        // Dummy Database
        const dummyApplications = [
            {
                email: 'budi@gmail.com',
                phone: '081234567890',
                name: 'Budi Santoso',
                position: 'Kru Photobooth',
                dateApplied: '20 Okt 2026',
                status: 'Menunggu Verifikasi Administrasi',
                lastUpdated: '21 Okt 2026',
                notes: 'Lamaran Anda telah diterima dan sedang dilakukan proses seleksi administrasi oleh tim HR kami.',
                badgeClass: 'status-kuning'
            },
            {
                email: 'siti@gmail.com',
                phone: '085678901234',
                name: 'Siti Aminah',
                position: 'Kru Photobooth',
                dateApplied: '15 Okt 2026',
                status: 'Lolos Administrasi',
                lastUpdated: '18 Okt 2026',
                notes: 'Selamat! Anda lolos tahap seleksi administrasi.<br><br><b>Jadwal Interview:</b><br>Senin, 25 Okt 2026 (10:00 WITA)<br>Lokasi: Kantor Potra Photobooth<br><br>Harap hadir 15 menit lebih awal.',
                badgeClass: 'status-hijau'
            },
            {
                email: 'joko@gmail.com',
                phone: '082123456789',
                name: 'Joko Widodo',
                position: 'Kru Photobooth',
                dateApplied: '10 Okt 2026',
                status: 'Penilaian Selesai',
                lastUpdated: '17 Okt 2026',
                notes: 'Terima kasih telah mengikuti proses interview. Saat ini hasil wawancara sedang diproses menggunakan sistem pendukung keputusan.',
                badgeClass: 'status-biru'
            },
            {
                email: 'andi@gmail.com',
                phone: '087812345678',
                name: 'Andi Pratama',
                position: 'Kru Photobooth',
                dateApplied: '01 Okt 2026',
                status: 'Tidak Diterima',
                lastUpdated: '10 Okt 2026',
                notes: 'Terima kasih telah mengikuti seluruh proses rekrutmen. Saat ini kami belum dapat melanjutkan proses rekrutmen Anda. Semoga sukses pada kesempatan berikutnya.',
                badgeClass: 'status-merah'
            }
        ];

        statusSearchForm.addEventListener('submit', function (e) {
            e.preventDefault();

            // Elements
            const searchEmail = document.getElementById('searchEmail').value.trim();
            const searchPhone = document.getElementById('searchPhone').value.trim();
            const btnCekStatus = document.getElementById('btnCekStatus');
            const btnText = btnCekStatus.querySelector('.btn-text');
            const btnIcon = btnCekStatus.querySelector('.btn-icon');
            const btnSpinner = btnCekStatus.querySelector('.btn-spinner');

            // Basic Validation
            if (!searchEmail || !searchPhone) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Oops...',
                    text: 'Silakan isi Email dan Nomor HP terlebih dahulu.',
                    confirmButtonColor: '#2563eb'
                });
                return;
            }

            // Button Loading State
            btnText.textContent = 'Memeriksa...';
            btnIcon.classList.add('d-none');
            btnSpinner.classList.remove('d-none');
            btnCekStatus.disabled = true;

            // Simulate Network Request
            const apiBase = (window.location.protocol === 'file:' || window.location.port === '5500' || window.location.port === '5501') ? 'http://localhost:3000' : '';
            fetch(`${apiBase}/api/applicants/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: searchEmail, whatsapp: searchPhone })
            })
            .then(async res => {
                const isJson = res.headers.get('content-type')?.includes('application/json');
                const data = isJson ? await res.json() : null;
                
                if (!res.ok) {
                    if (data) {
                        data.statusCode = res.status;
                        throw data;
                    }
                    throw new Error('Terjadi kesalahan pada server (Network Error).');
                }
                return data;
            })
            .then(data => {
                // Restore Button State
                btnText.textContent = 'Cek Status';
                btnIcon.classList.remove('d-none');
                btnSpinner.classList.add('d-none');
                btnCekStatus.disabled = false;

                if (data.success && data.data) {
                    const result = data.data.candidate;
                    const history = data.data.history || [];
                    
                    // Format dates
                    const formatDate = (dateStr) => {
                        const d = new Date(dateStr);
                        if (isNaN(d.getTime())) return '-';
                        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                    };
                    
                    let statusLabel = 'Seleksi Administrasi';
                    let badgeClass = 'status-kuning';
                    let notesStr = history.length > 0 && history[0].notes ? history[0].notes : 'Lamaran Anda sedang dalam antrean pengecekan berkas oleh tim administrasi kami. Harap bersabar menunggu informasi selanjutnya.';
                    
                    if (result.currentStatus === 'evaluated') {
                        statusLabel = 'Menunggu Hasil Akhir';
                        badgeClass = 'status-biru';
                        if (notesStr === 'Kandidat telah dievaluasi dan dinilai.' || (history.length > 0 && history[0].status !== 'evaluated')) {
                            notesStr = 'Tahap wawancara telah selesai dan nilai Anda sedang diproses oleh sistem. Silakan tunggu pengumuman keputusan akhir dari tim kami.';
                        }
                    } else if (result.currentStatus === 'rejected') {
                        statusLabel = 'Tidak Lolos';
                        badgeClass = 'status-merah';
                        if (notesStr === 'Mohon maaf, Anda belum memenuhi kriteria kami saat ini.' || (history.length > 0 && history[0].status !== 'rejected')) {
                            notesStr = 'Mohon maaf, Anda belum memenuhi kualifikasi untuk melanjutkan ke tahap berikutnya saat ini. Terima kasih atas partisipasi Anda dan tetap semangat!';
                        }
                    } else if (result.currentStatus === 'accepted') {
                        statusLabel = 'Selamat, Diterima!';
                        badgeClass = 'status-hijau';
                        if (notesStr === 'Selamat! Anda telah diterima.' || (history.length > 0 && history[0].status !== 'accepted')) {
                            notesStr = 'Selamat! Anda resmi diterima sebagai bagian dari tim Kru Potra. Silakan cek email Anda untuk informasi lebih lanjut mengenai tahap selanjutnya.';
                        }
                    }

                    // Success Render (SweetAlert2 Popup)
                    Swal.fire({
                        html: `
                        <div class="text-start">
                            <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-start border-bottom pb-3 mb-3 pe-5">
                                <div>
                                    <h4 class="fw-bold text-dark mb-1">${result.name}</h4>
                                    <p class="text-muted mb-0"><i class="fa-solid fa-briefcase me-2"></i> Pendaftar Kru Potra</p>
                                </div>
                                <div class="mt-3 mt-md-0 text-md-end">
                                    <div class="text-xs text-muted text-uppercase letter-spacing-1 mb-2">Status Rekrutmen</div>
                                    <span class="status-badge-modern ${badgeClass}">
                                        <i class="fa-solid fa-circle-dot" style="font-size: 0.6rem;"></i> ${statusLabel}
                                    </span>
                                </div>
                            </div>
                            
                            <div class="row g-3 mb-3">
                                <div class="col-6">
                                    <div class="text-xs text-muted text-uppercase letter-spacing-1 mb-1">Tanggal Melamar</div>
                                    <div class="fw-semibold text-dark">${formatDate(history[history.length - 1]?.created_at || new Date())}</div>
                                </div>
                                <div class="col-6">
                                    <div class="text-xs text-muted text-uppercase letter-spacing-1 mb-1">Terakhir Diperbarui</div>
                                    <div class="fw-semibold text-dark">${formatDate(result.lastUpdate)}</div>
                                </div>
                            </div>
                            
                            <div class="bg-light p-3 rounded-4 border-start border-4 border-primary mt-4">
                                <h6 class="fw-bold mb-2"><i class="fa-regular fa-bell me-2 text-primary"></i> Pengumuman</h6>
                                <p class="mb-0 text-muted small" style="line-height: 1.6; white-space: pre-line;">${notesStr}</p>
                            </div>
                        </div>
                        `,
                        showCloseButton: true,
                        showConfirmButton: false,
                        width: 600,
                        padding: '2em'
                    });
                } else {
                    // Error Render (SweetAlert2 Popup)
                    Swal.fire({
                        html: `
                        <div class="text-center py-2">
                            <div class="d-inline-flex justify-content-center align-items-center rounded-circle bg-light mb-4" style="width: 80px; height: 80px;">
                                <i class="fa-solid fa-magnifying-glass-location text-muted opacity-50" style="font-size: 2rem;"></i>
                            </div>
                            <h4 class="fw-bold text-dark mb-3">Data Tidak Ditemukan</h4>
                            <p class="text-muted mb-0 mx-auto" style="line-height: 1.6;">${data.message || 'Kami tidak dapat menemukan data lamaran dengan kombinasi Email dan Nomor HP tersebut.'}</p>
                            
                            <div class="bg-light p-3 rounded-4 border-start border-4 border-danger mt-4 text-start">
                                <h6 class="fw-bold mb-2 text-dark"><i class="fa-solid fa-triangle-exclamation me-2 text-danger"></i> Pengumuman</h6>
                                <p class="mb-0 text-muted small" style="line-height: 1.6;">Pastikan Anda telah mengisi formulir pendaftaran dengan benar. Jika Anda yakin telah mendaftar dan data tidak ditemukan, silakan hubungi admin kami melalui WhatsApp (+6287803264659) untuk bantuan lebih lanjut.</p>
                            </div>
                        </div>
                        `,
                        showCloseButton: true,
                        confirmButtonText: 'Coba Lagi',
                        confirmButtonColor: '#2563eb'
                    });
                }
            })
            .catch(error => {
                // Restore Button State
                btnText.textContent = 'Cek Status';
                btnIcon.classList.remove('d-none');
                btnSpinner.classList.add('d-none');
                btnCekStatus.disabled = false;
                
                // Jika error 404/400 (Data tidak ditemukan / validasi)
                if (error && error.message && error.success === false && error.statusCode !== 500) {
                    Swal.fire({
                        html: `
                        <div class="text-center py-2">
                            <div class="d-inline-flex justify-content-center align-items-center rounded-circle bg-light mb-4" style="width: 80px; height: 80px;">
                                <i class="fa-solid fa-magnifying-glass-location text-muted opacity-50" style="font-size: 2rem;"></i>
                            </div>
                            <h4 class="fw-bold text-dark mb-3">Data Tidak Ditemukan</h4>
                            <p class="text-muted mb-0 mx-auto" style="line-height: 1.6;">${error.message}</p>
                            
                            <div class="bg-light p-3 rounded-4 border-start border-4 border-danger mt-4 text-start">
                                <h6 class="fw-bold mb-2 text-dark"><i class="fa-solid fa-triangle-exclamation me-2 text-danger"></i> Pengumuman</h6>
                                <p class="mb-0 text-muted small" style="line-height: 1.6;">Pastikan Anda telah mengisi formulir pendaftaran dengan benar. Jika Anda yakin telah mendaftar dan data tidak ditemukan, silakan hubungi admin kami melalui WhatsApp (+6287803264659) untuk bantuan lebih lanjut.</p>
                            </div>
                        </div>
                        `,
                        showCloseButton: true,
                        confirmButtonText: 'Coba Lagi',
                        confirmButtonColor: '#2563eb'
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Kesalahan Sistem',
                        text: 'Gagal terhubung ke server. Silakan coba lagi nanti.',
                        confirmButtonColor: '#2563eb'
                    });
                }
            });
        });
    }

});
