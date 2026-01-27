export interface Question {
  id: string
  type: 'multiple_choice' | 'true_false'
  question: string
  options: string[] // For multiple choice (empty for true/false)
  correctAnswer: number | boolean // index for multiple choice, boolean for true/false
  icon?: string // Icon name for visual aid
}

export interface Section {
  id: string
  title: string
  videoUrl: string // local asset or placeholder
  thumbnailUrl: string
  duration: number // in seconds
  questions: Question[]
}

export interface Course {
  id: string
  title: string
  description: string
  shortDescription: string
  imageUrl: string
  sections: Section[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: string
  passingThreshold: number // Minimum percentage (0-100) required to pass and get certificate
  category: string // Category/tag for filtering
  rating?: number // Course rating out of 5
  tags: string[] // Tags for filtering and display
}

// Sample video URL for all sections
const SAMPLE_VIDEO_URL = require('@/assets/videos/Crypto Bro A.mp4')
// 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'

// Mock courses data
export const mockCourses: Course[] = [
  {
    id: '1',
    title: 'Waste Sorting Basics',
    shortDescription:
      'Learn the fundamentals of sorting different types of waste materials',
    description:
      'This course covers the essential skills needed to properly identify and sort various waste materials. You will learn about different categories of recyclables, how to recognize them, and the proper way to handle each type.',
    imageUrl: 'course-waste-sorting',
    difficulty: 'beginner',
    estimatedTime: '30 min',
    passingThreshold: 75,
    category: 'science',
    rating: 3.7,
    tags: ['recycling', 'environment', 'waste management', 'sustainability'],
    sections: [
      {
        id: '1-1',
        title: 'Introduction to Waste Types',
        videoUrl: SAMPLE_VIDEO_URL,
        thumbnailUrl: 'section-1-1',
        duration: 180,
        questions: [
          {
            id: '1-1-q1',
            type: 'multiple_choice',
            question: 'Which of these materials is recyclable?',
            options: [
              'Plastic bottle',
              'Food waste',
              'Dirty paper',
              'Broken glass with food',
            ],
            correctAnswer: 0,
            icon: 'refresh-circle',
          },
          {
            id: '1-1-q2',
            type: 'true_false',
            question: 'All plastic materials can be recycled together',
            options: [],
            correctAnswer: false,
            icon: 'help-circle',
          },
        ],
      },
      {
        id: '1-2',
        title: 'Identifying Recyclable Materials',
        videoUrl: SAMPLE_VIDEO_URL,
        thumbnailUrl: 'section-1-2',
        duration: 240,
        questions: [
          {
            id: '1-2-q1',
            type: 'multiple_choice',
            question: 'What does the recycling symbol with number 1 mean?',
            options: ['PET plastic', 'HDPE plastic', 'PVC plastic', 'Paper'],
            correctAnswer: 0,
            icon: 'information-circle',
          },
          {
            id: '1-2-q2',
            type: 'true_false',
            question: 'Aluminum cans should be crushed before recycling',
            options: [],
            correctAnswer: true,
            icon: 'cube',
          },
          {
            id: '1-2-q3',
            type: 'multiple_choice',
            question: 'Which color of glass is most commonly recycled?',
            options: [
              'Clear glass',
              'Brown glass',
              'Green glass',
              'All are equally recyclable',
            ],
            correctAnswer: 3,
            icon: 'wine',
          },
        ],
      },
      {
        id: '1-3',
        title: 'Proper Sorting Techniques',
        videoUrl: SAMPLE_VIDEO_URL,
        thumbnailUrl: 'section-1-1',
        duration: 200,
        questions: [
          {
            id: '1-3-q1',
            type: 'true_false',
            question: 'Materials should be cleaned before recycling',
            options: [],
            correctAnswer: true,
            icon: 'water',
          },
          {
            id: '1-3-q2',
            type: 'multiple_choice',
            question: 'What should you do with plastic bottle caps?',
            options: [
              'Throw them away',
              'Leave them on the bottle',
              'Recycle separately',
              'Remove and save them',
            ],
            correctAnswer: 1,
            icon: 'flask',
          },
        ],
      },
    ],
  },
  {
    id: '2',
    title: 'Recycling Safety',
    shortDescription:
      'Essential safety practices for handling recyclable materials',
    description:
      'Safety is crucial when working with recyclable materials. This course teaches you how to protect yourself from sharp objects, hazardous materials, and other workplace dangers. Learn proper equipment usage and emergency procedures.',
    imageUrl: 'course-recycling-safety',
    difficulty: 'beginner',
    estimatedTime: '45 min',
    passingThreshold: 75,
    category: 'science',
    rating: 3.7,
    tags: ['safety', 'workplace', 'PPE', 'health'],
    sections: [
      {
        id: '2-1',
        title: 'Personal Protection Equipment',
        videoUrl: SAMPLE_VIDEO_URL,
        thumbnailUrl: 'section-1-1',
        duration: 220,
        questions: [
          {
            id: '2-1-q1',
            type: 'multiple_choice',
            question: 'Which safety equipment is essential when sorting waste?',
            options: [
              'Gloves only',
              'Gloves and safety shoes',
              'Just be careful',
              'Nothing needed',
            ],
            correctAnswer: 1,
            icon: 'shield-checkmark',
          },
          {
            id: '2-1-q2',
            type: 'true_false',
            question: 'You can reuse disposable gloves if they look clean',
            options: [],
            correctAnswer: false,
            icon: 'hand-right',
          },
        ],
      },
      {
        id: '2-2',
        title: 'Handling Sharp Objects',
        videoUrl: SAMPLE_VIDEO_URL,
        thumbnailUrl: 'section-1-2',
        duration: 180,
        questions: [
          {
            id: '2-2-q1',
            type: 'true_false',
            question: 'Broken glass should be wrapped before disposal',
            options: [],
            correctAnswer: true,
            icon: 'warning',
          },
          {
            id: '2-2-q2',
            type: 'multiple_choice',
            question: 'What should you do if you get cut?',
            options: [
              'Continue working',
              'Stop and clean the wound immediately',
              'Finish your shift first',
              'Just put on a new glove',
            ],
            correctAnswer: 1,
            icon: 'medkit',
          },
        ],
      },
      {
        id: '2-3',
        title: 'Identifying Hazardous Materials',
        videoUrl: SAMPLE_VIDEO_URL,
        thumbnailUrl: 'section-1-1',
        duration: 260,
        questions: [
          {
            id: '2-3-q1',
            type: 'multiple_choice',
            question: 'Which of these is considered hazardous waste?',
            options: [
              'Plastic bags',
              'Battery',
              'Cardboard box',
              'Glass bottle',
            ],
            correctAnswer: 1,
            icon: 'battery-charging',
          },
          {
            id: '2-3-q2',
            type: 'true_false',
            question: 'Aerosol cans can be safely compressed with other metals',
            options: [],
            correctAnswer: false,
            icon: 'alert-circle',
          },
        ],
      },
      {
        id: '2-4',
        title: 'Emergency Procedures',
        videoUrl: SAMPLE_VIDEO_URL,
        thumbnailUrl: 'section-1-2',
        duration: 200,
        questions: [
          {
            id: '2-4-q1',
            type: 'true_false',
            question: 'You should know where the first aid kit is located',
            options: [],
            correctAnswer: true,
            icon: 'medical',
          },
          {
            id: '2-4-q2',
            type: 'multiple_choice',
            question: 'If you see a fire, what should you do first?',
            options: [
              'Try to put it out',
              'Alert others and evacuate',
              'Call your supervisor',
              'Take a photo',
            ],
            correctAnswer: 1,
            icon: 'flame',
          },
        ],
      },
    ],
  },
  {
    id: '3',
    title: 'Material Identification',
    shortDescription:
      'Master the art of identifying different recyclable materials',
    description:
      'Become an expert at recognizing and categorizing various recyclable materials. This course covers plastics, metals, paper products, and special materials, teaching you how to quickly and accurately identify what can be recycled and where it should go.',
    imageUrl: 'course-material-identification',
    difficulty: 'intermediate',
    estimatedTime: '35 min',
    passingThreshold: 75,
    category: 'science',
    rating: 3.7,
    tags: ['materials', 'identification', 'recycling', 'classification'],
    sections: [
      {
        id: '3-1',
        title: 'Understanding Plastic Types',
        videoUrl: SAMPLE_VIDEO_URL,
        thumbnailUrl: 'section-1-1',
        duration: 240,
        questions: [
          {
            id: '3-1-q1',
            type: 'multiple_choice',
            question: 'How many main types of plastic are commonly recycled?',
            options: ['3 types', '5 types', '7 types', '10 types'],
            correctAnswer: 2,
            icon: 'list',
          },
          {
            id: '3-1-q2',
            type: 'true_false',
            question: 'HDPE plastic is commonly used for milk jugs',
            options: [],
            correctAnswer: true,
            icon: 'nutrition',
          },
        ],
      },
      {
        id: '3-2',
        title: 'Metal Classification',
        videoUrl: SAMPLE_VIDEO_URL,
        thumbnailUrl: 'section-1-2',
        duration: 210,
        questions: [
          {
            id: '3-2-q1',
            type: 'multiple_choice',
            question: 'Which metal is most valuable for recycling?',
            options: ['Steel', 'Aluminum', 'Copper', 'Iron'],
            correctAnswer: 2,
            icon: 'cash',
          },
          {
            id: '3-2-q2',
            type: 'true_false',
            question:
              'Magnets can help separate ferrous from non-ferrous metals',
            options: [],
            correctAnswer: true,
            icon: 'magnet',
          },
          {
            id: '3-2-q3',
            type: 'multiple_choice',
            question: 'What is the best way to identify aluminum?',
            options: [
              'It is very heavy',
              'It is magnetic',
              'It is lightweight and non-magnetic',
              'It rusts quickly',
            ],
            correctAnswer: 2,
            icon: 'scan',
          },
        ],
      },
      {
        id: '3-3',
        title: 'Paper and Cardboard Quality',
        videoUrl: SAMPLE_VIDEO_URL,
        thumbnailUrl: 'section-1-1',
        duration: 190,
        questions: [
          {
            id: '3-3-q1',
            type: 'true_false',
            question: 'Wet or soiled paper cannot be recycled',
            options: [],
            correctAnswer: true,
            icon: 'water',
          },
          {
            id: '3-3-q2',
            type: 'multiple_choice',
            question: 'Which type of paper is most valuable?',
            options: [
              'Newspaper',
              'White office paper',
              'Mixed paper',
              'Cardboard',
            ],
            correctAnswer: 1,
            icon: 'document-text',
          },
        ],
      },
    ],
  },
]

// Helper function to get course by ID
export const getCourseById = (courseId: string): Course | undefined => {
  return mockCourses.find((course) => course.id === courseId)
}

// Helper function to get section by course ID and section ID
export const getSectionById = (
  courseId: string,
  sectionId: string
): Section | undefined => {
  const course = getCourseById(courseId)
  return course?.sections.find((section) => section.id === sectionId)
}

// Helper function to get next section
export const getNextSection = (
  courseId: string,
  currentSectionId: string
): Section | null => {
  const course = getCourseById(courseId)
  if (!course) return null

  const currentIndex = course.sections.findIndex(
    (section) => section.id === currentSectionId
  )
  if (currentIndex === -1 || currentIndex === course.sections.length - 1) {
    return null
  }

  return course.sections[currentIndex + 1]
}
