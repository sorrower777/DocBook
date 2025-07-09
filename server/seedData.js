const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const { User, DoctorProfile } = require('./models');

// Load environment variables
dotenv.config();

// Sample doctor data with 50 different doctors
const doctorsData = [
  // Cardiology
  {
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@hospital.com',
    specialty: 'Cardiology',
    qualifications: 'MBBS, MD Cardiology, FACC',
    experienceInYears: 15,
    consultationFee: 200,
    about: 'Specialized in interventional cardiology and heart disease prevention. Expert in cardiac catheterization and angioplasty procedures.'
  },
  {
    name: 'Dr. Michael Chen',
    email: 'michael.chen@cardio.com',
    specialty: 'Cardiology',
    qualifications: 'MBBS, DM Cardiology, FESC',
    experienceInYears: 12,
    consultationFee: 180,
    about: 'Focus on pediatric cardiology and congenital heart diseases. Published researcher in cardiac imaging.'
  },
  {
    name: 'Dr. Emily Rodriguez',
    email: 'emily.rodriguez@heart.com',
    specialty: 'Cardiology',
    qualifications: 'MBBS, MD, Fellowship in Electrophysiology',
    experienceInYears: 18,
    consultationFee: 220,
    about: 'Expert in cardiac arrhythmias and pacemaker implantation. Specializes in complex electrophysiology procedures.'
  },
  {
    name: 'Dr. David Kim',
    email: 'david.kim@cardiac.com',
    specialty: 'Cardiology',
    qualifications: 'MBBS, MD Cardiology, FAHA',
    experienceInYears: 20,
    consultationFee: 250,
    about: 'Leading expert in heart failure management and cardiac transplantation. 20+ years of experience.'
  },

  // Dermatology
  {
    name: 'Dr. Lisa Thompson',
    email: 'lisa.thompson@skincare.com',
    specialty: 'Dermatology',
    qualifications: 'MBBS, MD Dermatology, FAAD',
    experienceInYears: 10,
    consultationFee: 150,
    about: 'Specializes in cosmetic dermatology, anti-aging treatments, and skin cancer screening.'
  },
  {
    name: 'Dr. James Wilson',
    email: 'james.wilson@derma.com',
    specialty: 'Dermatology',
    qualifications: 'MBBS, DVD, DNB Dermatology',
    experienceInYears: 8,
    consultationFee: 120,
    about: 'Expert in pediatric dermatology and treatment of eczema, psoriasis, and other skin conditions.'
  },
  {
    name: 'Dr. Maria Garcia',
    email: 'maria.garcia@skinhealth.com',
    specialty: 'Dermatology',
    qualifications: 'MBBS, MD Dermatology, Fellowship in Mohs Surgery',
    experienceInYears: 14,
    consultationFee: 180,
    about: 'Specialized in skin cancer treatment and Mohs micrographic surgery. Expert in dermatopathology.'
  },
  {
    name: 'Dr. Robert Lee',
    email: 'robert.lee@aesthetic.com',
    specialty: 'Dermatology',
    qualifications: 'MBBS, MD, Certificate in Aesthetic Medicine',
    experienceInYears: 11,
    consultationFee: 160,
    about: 'Focus on aesthetic dermatology, laser treatments, and non-surgical facial rejuvenation.'
  },

  // Neurology
  {
    name: 'Dr. Jennifer Brown',
    email: 'jennifer.brown@neuro.com',
    specialty: 'Neurology',
    qualifications: 'MBBS, MD Neurology, DM Neurology',
    experienceInYears: 16,
    consultationFee: 190,
    about: 'Specializes in epilepsy management and neurophysiology. Expert in EEG interpretation and seizure disorders.'
  },
  {
    name: 'Dr. Thomas Anderson',
    email: 'thomas.anderson@brain.com',
    specialty: 'Neurology',
    qualifications: 'MBBS, MD, Fellowship in Movement Disorders',
    experienceInYears: 13,
    consultationFee: 200,
    about: 'Expert in Parkinson\'s disease, tremors, and other movement disorders. Research focus on neurodegenerative diseases.'
  },
  {
    name: 'Dr. Amanda Davis',
    email: 'amanda.davis@stroke.com',
    specialty: 'Neurology',
    qualifications: 'MBBS, MD Neurology, Stroke Fellowship',
    experienceInYears: 9,
    consultationFee: 170,
    about: 'Specialized in stroke care and cerebrovascular diseases. Expert in acute stroke intervention.'
  },
  {
    name: 'Dr. Christopher Miller',
    email: 'christopher.miller@headache.com',
    specialty: 'Neurology',
    qualifications: 'MBBS, MD, Headache Medicine Fellowship',
    experienceInYears: 7,
    consultationFee: 160,
    about: 'Focus on headache and migraine management. Specialized in chronic pain and headache disorders.'
  },

  // Orthopedics
  {
    name: 'Dr. Kevin Martinez',
    email: 'kevin.martinez@ortho.com',
    specialty: 'Orthopedics',
    qualifications: 'MBBS, MS Orthopedics, Fellowship in Joint Replacement',
    experienceInYears: 17,
    consultationFee: 180,
    about: 'Expert in joint replacement surgery, particularly knee and hip replacements. Minimally invasive techniques.'
  },
  {
    name: 'Dr. Rachel Taylor',
    email: 'rachel.taylor@sports.com',
    specialty: 'Orthopedics',
    qualifications: 'MBBS, MS Orthopedics, Sports Medicine Fellowship',
    experienceInYears: 11,
    consultationFee: 170,
    about: 'Specialized in sports medicine and arthroscopic surgery. Team physician for professional athletes.'
  },
  {
    name: 'Dr. Daniel White',
    email: 'daniel.white@spine.com',
    specialty: 'Orthopedics',
    qualifications: 'MBBS, MS Orthopedics, Spine Fellowship',
    experienceInYears: 19,
    consultationFee: 220,
    about: 'Expert in spine surgery and complex spinal deformity correction. Minimally invasive spine procedures.'
  },
  {
    name: 'Dr. Nicole Harris',
    email: 'nicole.harris@pediatricortho.com',
    specialty: 'Orthopedics',
    qualifications: 'MBBS, MS Orthopedics, Pediatric Orthopedics Fellowship',
    experienceInYears: 12,
    consultationFee: 160,
    about: 'Specialized in pediatric orthopedics and congenital musculoskeletal disorders in children.'
  },

  // Pediatrics
  {
    name: 'Dr. Steven Clark',
    email: 'steven.clark@pediatrics.com',
    specialty: 'Pediatrics',
    qualifications: 'MBBS, MD Pediatrics, IAP Fellowship',
    experienceInYears: 14,
    consultationFee: 120,
    about: 'General pediatrician with expertise in child development and preventive care. Vaccination specialist.'
  },
  {
    name: 'Dr. Michelle Lewis',
    email: 'michelle.lewis@childcare.com',
    specialty: 'Pediatrics',
    qualifications: 'MBBS, MD Pediatrics, Neonatology Fellowship',
    experienceInYears: 10,
    consultationFee: 140,
    about: 'Specialized in neonatal care and premature infant management. NICU consultant.'
  },
  {
    name: 'Dr. Brian Walker',
    email: 'brian.walker@kidsdoc.com',
    specialty: 'Pediatrics',
    qualifications: 'MBBS, MD Pediatrics, Pediatric Cardiology Fellowship',
    experienceInYears: 16,
    consultationFee: 180,
    about: 'Expert in pediatric cardiology and congenital heart diseases in children.'
  },
  {
    name: 'Dr. Laura Hall',
    email: 'laura.hall@childhealth.com',
    specialty: 'Pediatrics',
    qualifications: 'MBBS, MD Pediatrics, Adolescent Medicine Fellowship',
    experienceInYears: 8,
    consultationFee: 130,
    about: 'Focus on adolescent medicine and teenage health issues. Expert in growth and development.'
  },

  // Psychiatry
  {
    name: 'Dr. Mark Young',
    email: 'mark.young@mentalhealth.com',
    specialty: 'Psychiatry',
    qualifications: 'MBBS, MD Psychiatry, Fellowship in Addiction Medicine',
    experienceInYears: 13,
    consultationFee: 150,
    about: 'Specialized in addiction psychiatry and substance abuse treatment. Dual diagnosis expert.'
  },
  {
    name: 'Dr. Sandra King',
    email: 'sandra.king@therapy.com',
    specialty: 'Psychiatry',
    qualifications: 'MBBS, MD Psychiatry, Child Psychiatry Fellowship',
    experienceInYears: 11,
    consultationFee: 160,
    about: 'Expert in child and adolescent psychiatry. Specializes in ADHD, autism, and behavioral disorders.'
  },
  {
    name: 'Dr. Paul Wright',
    email: 'paul.wright@anxiety.com',
    specialty: 'Psychiatry',
    qualifications: 'MBBS, MD Psychiatry, Anxiety Disorders Fellowship',
    experienceInYears: 15,
    consultationFee: 170,
    about: 'Specialized in anxiety disorders, panic attacks, and mood disorders. Cognitive behavioral therapy expert.'
  },
  {
    name: 'Dr. Karen Lopez',
    email: 'karen.lopez@geriatricpsych.com',
    specialty: 'Psychiatry',
    qualifications: 'MBBS, MD Psychiatry, Geriatric Psychiatry Fellowship',
    experienceInYears: 18,
    consultationFee: 180,
    about: 'Expert in geriatric psychiatry and dementia care. Specialized in elderly mental health.'
  },

  // General Medicine
  {
    name: 'Dr. Richard Hill',
    email: 'richard.hill@familymed.com',
    specialty: 'General Medicine',
    qualifications: 'MBBS, MD Internal Medicine',
    experienceInYears: 12,
    consultationFee: 100,
    about: 'Family physician providing comprehensive primary care for all ages. Preventive medicine specialist.'
  },
  {
    name: 'Dr. Patricia Green',
    email: 'patricia.green@primarycare.com',
    specialty: 'General Medicine',
    qualifications: 'MBBS, Diploma in Family Medicine',
    experienceInYears: 9,
    consultationFee: 90,
    about: 'Primary care physician with focus on women\'s health and chronic disease management.'
  },
  {
    name: 'Dr. Joseph Adams',
    email: 'joseph.adams@internalmedicine.com',
    specialty: 'General Medicine',
    qualifications: 'MBBS, MD Internal Medicine, Geriatrics Fellowship',
    experienceInYears: 16,
    consultationFee: 110,
    about: 'Internal medicine specialist with expertise in geriatric care and multiple chronic conditions.'
  },
  {
    name: 'Dr. Elizabeth Baker',
    email: 'elizabeth.baker@wellness.com',
    specialty: 'General Medicine',
    qualifications: 'MBBS, MD, Certificate in Lifestyle Medicine',
    experienceInYears: 7,
    consultationFee: 95,
    about: 'Focus on preventive medicine and lifestyle interventions for optimal health and wellness.'
  },

  // Endocrinology
  {
    name: 'Dr. William Gonzalez',
    email: 'william.gonzalez@diabetes.com',
    specialty: 'Endocrinology',
    qualifications: 'MBBS, MD Internal Medicine, Endocrinology Fellowship',
    experienceInYears: 14,
    consultationFee: 170,
    about: 'Diabetes specialist and expert in thyroid disorders. Advanced insulin pump and CGM management.'
  },
  {
    name: 'Dr. Mary Nelson',
    email: 'mary.nelson@hormone.com',
    specialty: 'Endocrinology',
    qualifications: 'MBBS, MD, DM Endocrinology',
    experienceInYears: 11,
    consultationFee: 160,
    about: 'Specialized in reproductive endocrinology and hormone replacement therapy. PCOS expert.'
  },
  {
    name: 'Dr. Charles Carter',
    email: 'charles.carter@thyroid.com',
    specialty: 'Endocrinology',
    qualifications: 'MBBS, MD Endocrinology, Thyroid Fellowship',
    experienceInYears: 17,
    consultationFee: 180,
    about: 'Expert in thyroid diseases, thyroid cancer, and endocrine surgery consultation.'
  },
  {
    name: 'Dr. Susan Mitchell',
    email: 'susan.mitchell@metabolism.com',
    specialty: 'Endocrinology',
    qualifications: 'MBBS, MD, Obesity Medicine Fellowship',
    experienceInYears: 9,
    consultationFee: 150,
    about: 'Specialized in obesity medicine and metabolic disorders. Weight management expert.'
  },

  // Gastroenterology
  {
    name: 'Dr. Anthony Perez',
    email: 'anthony.perez@gastro.com',
    specialty: 'Gastroenterology',
    qualifications: 'MBBS, MD Internal Medicine, Gastroenterology Fellowship',
    experienceInYears: 13,
    consultationFee: 180,
    about: 'Expert in inflammatory bowel disease and advanced endoscopic procedures. Colonoscopy specialist.'
  },
  {
    name: 'Dr. Linda Roberts',
    email: 'linda.roberts@liver.com',
    specialty: 'Gastroenterology',
    qualifications: 'MBBS, MD, Hepatology Fellowship',
    experienceInYears: 15,
    consultationFee: 200,
    about: 'Specialized in liver diseases, hepatitis management, and liver transplant evaluation.'
  },
  {
    name: 'Dr. Frank Turner',
    email: 'frank.turner@digestive.com',
    specialty: 'Gastroenterology',
    qualifications: 'MBBS, MD Gastroenterology, Advanced Endoscopy Fellowship',
    experienceInYears: 18,
    consultationFee: 220,
    about: 'Expert in advanced therapeutic endoscopy and pancreatic diseases. ERCP specialist.'
  },
  {
    name: 'Dr. Barbara Phillips',
    email: 'barbara.phillips@ibd.com',
    specialty: 'Gastroenterology',
    qualifications: 'MBBS, MD, IBD Fellowship',
    experienceInYears: 10,
    consultationFee: 170,
    about: 'Specialized in Crohn\'s disease and ulcerative colitis management. Biologic therapy expert.'
  },

  // Oncology
  {
    name: 'Dr. Gary Campbell',
    email: 'gary.campbell@cancer.com',
    specialty: 'Oncology',
    qualifications: 'MBBS, MD Internal Medicine, Hematology-Oncology Fellowship',
    experienceInYears: 16,
    consultationFee: 250,
    about: 'Medical oncologist specializing in breast and lung cancer treatment. Immunotherapy expert.'
  },
  {
    name: 'Dr. Helen Parker',
    email: 'helen.parker@bloodcancer.com',
    specialty: 'Oncology',
    qualifications: 'MBBS, MD, Hematology Fellowship',
    experienceInYears: 12,
    consultationFee: 230,
    about: 'Hematologist specializing in leukemia, lymphoma, and bone marrow transplantation.'
  },
  {
    name: 'Dr. Ronald Evans',
    email: 'ronald.evans@radiation.com',
    specialty: 'Oncology',
    qualifications: 'MBBS, MD Radiation Oncology',
    experienceInYears: 14,
    consultationFee: 240,
    about: 'Radiation oncologist with expertise in stereotactic radiosurgery and advanced radiation techniques.'
  },
  {
    name: 'Dr. Dorothy Edwards',
    email: 'dorothy.edwards@pediatriccancer.com',
    specialty: 'Oncology',
    qualifications: 'MBBS, MD Pediatrics, Pediatric Oncology Fellowship',
    experienceInYears: 11,
    consultationFee: 220,
    about: 'Pediatric oncologist specializing in childhood cancers and survivorship care.'
  },

  // Surgery
  {
    name: 'Dr. Kenneth Collins',
    email: 'kenneth.collins@surgery.com',
    specialty: 'Surgery',
    qualifications: 'MBBS, MS General Surgery, FACS',
    experienceInYears: 20,
    consultationFee: 200,
    about: 'General surgeon with expertise in laparoscopic and robotic surgery. Trauma surgery specialist.'
  },
  {
    name: 'Dr. Betty Stewart',
    email: 'betty.stewart@plasticsurgery.com',
    specialty: 'Surgery',
    qualifications: 'MBBS, MS Plastic Surgery, FACS',
    experienceInYears: 15,
    consultationFee: 300,
    about: 'Plastic and reconstructive surgeon specializing in cosmetic surgery and breast reconstruction.'
  },
  {
    name: 'Dr. Larry Sanchez',
    email: 'larry.sanchez@cardiac.com',
    specialty: 'Surgery',
    qualifications: 'MBBS, MS Cardiothoracic Surgery',
    experienceInYears: 18,
    consultationFee: 350,
    about: 'Cardiothoracic surgeon specializing in heart surgery and lung transplantation.'
  },
  {
    name: 'Dr. Deborah Morris',
    email: 'deborah.morris@neurosurgery.com',
    specialty: 'Surgery',
    qualifications: 'MBBS, MS Neurosurgery',
    experienceInYears: 16,
    consultationFee: 400,
    about: 'Neurosurgeon specializing in brain tumors and complex spinal surgery.'
  },

  // Urology
  {
    name: 'Dr. Jerry Rogers',
    email: 'jerry.rogers@urology.com',
    specialty: 'Urology',
    qualifications: 'MBBS, MS Urology, FACS',
    experienceInYears: 14,
    consultationFee: 180,
    about: 'Urologist specializing in kidney stones, prostate diseases, and minimally invasive surgery.'
  },
  {
    name: 'Dr. Donna Reed',
    email: 'donna.reed@kidneydoc.com',
    specialty: 'Urology',
    qualifications: 'MBBS, MS Urology, Pediatric Urology Fellowship',
    experienceInYears: 10,
    consultationFee: 170,
    about: 'Pediatric urologist specializing in congenital urological abnormalities in children.'
  },
  {
    name: 'Dr. Walter Cook',
    email: 'walter.cook@prostate.com',
    specialty: 'Urology',
    qualifications: 'MBBS, MS Urology, Robotic Surgery Fellowship',
    experienceInYears: 17,
    consultationFee: 200,
    about: 'Expert in robotic prostate surgery and urological oncology. Minimally invasive techniques.'
  },
  {
    name: 'Dr. Carol Bailey',
    email: 'carol.bailey@bladder.com',
    specialty: 'Urology',
    qualifications: 'MBBS, MS Urology, Female Urology Fellowship',
    experienceInYears: 12,
    consultationFee: 160,
    about: 'Specialized in female urology and pelvic floor disorders. Incontinence treatment expert.'
  },

  // Radiology
  {
    name: 'Dr. Arthur Rivera',
    email: 'arthur.rivera@imaging.com',
    specialty: 'Radiology',
    qualifications: 'MBBS, MD Radiology, Body Imaging Fellowship',
    experienceInYears: 13,
    consultationFee: 150,
    about: 'Diagnostic radiologist specializing in abdominal and pelvic imaging. CT and MRI expert.'
  },
  {
    name: 'Dr. Cheryl Cooper',
    email: 'cheryl.cooper@breastimaging.com',
    specialty: 'Radiology',
    qualifications: 'MBBS, MD Radiology, Breast Imaging Fellowship',
    experienceInYears: 11,
    consultationFee: 140,
    about: 'Specialized in breast imaging and mammography. Early breast cancer detection expert.'
  },
  {
    name: 'Dr. Ralph Richardson',
    email: 'ralph.richardson@neuroradiology.com',
    specialty: 'Radiology',
    qualifications: 'MBBS, MD Radiology, Neuroradiology Fellowship',
    experienceInYears: 15,
    consultationFee: 170,
    about: 'Neuroradiologist specializing in brain and spine imaging. Stroke imaging expert.'
  },
  {
    name: 'Dr. Joyce Cox',
    email: 'joyce.cox@pediatricradiology.com',
    specialty: 'Radiology',
    qualifications: 'MBBS, MD Radiology, Pediatric Radiology Fellowship',
    experienceInYears: 9,
    consultationFee: 130,
    about: 'Pediatric radiologist specializing in children\'s imaging and radiation safety.'
  }
];

// Function to create seed data
async function seedDoctors() {
  try {
    console.log('🌱 Starting to seed doctor data...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing data (optional - comment out if you want to keep existing data)
    // await User.deleteMany({ role: 'doctor' });
    // await DoctorProfile.deleteMany({});
    // console.log('🗑️ Cleared existing doctor data');

    let createdCount = 0;
    let skippedCount = 0;

    for (const doctorData of doctorsData) {
      try {
        // Check if doctor already exists
        const existingUser = await User.findOne({ email: doctorData.email });
        if (existingUser) {
          console.log(`⏭️ Skipping ${doctorData.name} - already exists`);
          skippedCount++;
          continue;
        }

        // Create user account
        const user = new User({
          name: doctorData.name,
          email: doctorData.email,
          password: 'password123', // Default password for all seed doctors
          role: 'doctor',
          isVerified: true // Auto-verify seed doctors
        });

        await user.save();

        // Create doctor profile
        const doctorProfile = new DoctorProfile({
          user: user._id,
          specialty: doctorData.specialty,
          qualifications: doctorData.qualifications.split(',').map(q => q.trim()),
          experience: doctorData.experienceInYears,
          bio: doctorData.about,
          consultationFee: doctorData.consultationFee,
          isVerified: true,
          // Default values for optional fields
          clinicAddress: '',
          phone: '',
          availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          availableTime: { start: '09:00', end: '17:00' }
        });

        await doctorProfile.save();
        console.log(`✅ Created ${doctorData.name} - ${doctorData.specialty}`);
        createdCount++;

      } catch (error) {
        console.error(`❌ Error creating ${doctorData.name}:`, error.message);
      }
    }

    console.log('\n🎉 Seeding completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Created: ${createdCount} doctors`);
    console.log(`   - Skipped: ${skippedCount} doctors (already existed)`);
    console.log(`   - Total: ${doctorsData.length} doctors processed`);

    console.log('\n📋 Specialties seeded:');
    const specialties = [...new Set(doctorsData.map(d => d.specialty))];
    specialties.forEach(specialty => {
      const count = doctorsData.filter(d => d.specialty === specialty).length;
      console.log(`   - ${specialty}: ${count} doctors`);
    });

    console.log('\n🔐 Login credentials for all seed doctors:');
    console.log('   - Password: password123');
    console.log('   - All doctors are auto-verified and ready to accept appointments');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the seeding function
if (require.main === module) {
  seedDoctors();
}

module.exports = { seedDoctors, doctorsData };
