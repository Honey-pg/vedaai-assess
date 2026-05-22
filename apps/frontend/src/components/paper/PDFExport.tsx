'use client';

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Times-Roman',
    fontSize: 11,
  },
  header: {
    textAlign: 'center',
    marginBottom: 16,
  },
  institutionName: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Times-Bold',
    marginBottom: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Times-Bold',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    fontSize: 10,
    marginBottom: 4,
  },
  metaItem: {
    fontSize: 10,
    color: '#444',
  },
  metaBold: {
    fontFamily: 'Times-Bold',
    color: '#000',
  },
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    marginVertical: 8,
  },
  studentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoField: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  infoLabel: {
    fontSize: 10,
    fontFamily: 'Times-Bold',
  },
  infoLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#999',
    width: 100,
    paddingBottom: 2,
  },
  sectionHeader: {
    borderTopWidth: 2,
    borderTopColor: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#999',
    paddingVertical: 4,
    marginBottom: 8,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Times-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionMarks: {
    fontSize: 9,
    color: '#666',
    position: 'absolute',
    right: 0,
    top: 4,
  },
  sectionInstruction: {
    fontSize: 9,
    fontStyle: 'italic',
    color: '#666',
    marginTop: 2,
  },
  question: {
    flexDirection: 'row',
    marginBottom: 10,
    paddingRight: 10,
  },
  questionNumber: {
    width: 28,
    fontSize: 10,
    fontFamily: 'Courier',
    fontWeight: 'bold',
    color: '#666',
    paddingTop: 1,
  },
  questionContent: {
    flex: 1,
  },
  questionTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  questionText: {
    fontSize: 11,
    lineHeight: 1.5,
    flex: 1,
    paddingRight: 8,
  },
  questionMeta: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
    flexShrink: 0,
  },
  difficultyBadge: {
    fontSize: 8,
    padding: '2 6',
    borderRadius: 3,
    borderWidth: 1,
  },
  easyBadge: {
    backgroundColor: '#dcfce7',
    color: '#15803d',
    borderColor: '#bbf7d0',
  },
  mediumBadge: {
    backgroundColor: '#fef9c3',
    color: '#a16207',
    borderColor: '#fde68a',
  },
  hardBadge: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    borderColor: '#fecaca',
  },
  marksText: {
    fontSize: 9,
    color: '#666',
  },
  option: {
    fontSize: 10,
    marginLeft: 12,
    marginBottom: 2,
    lineHeight: 1.5,
  },
  answerLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    borderBottomStyle: 'dashed' as const,
    marginTop: 6,
    height: 20,
  },
  answer: {
    fontSize: 9,
    color: '#16a34a',
    fontFamily: 'Times-Bold',
    marginTop: 4,
  },
  footer: {
    textAlign: 'center',
    fontSize: 9,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 20,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
});

interface Question {
  id: string;
  text: string;
  type: string;
  difficulty: string;
  marks: number;
  options?: string[];
  correctAnswer?: string;
}

interface Section {
  id: string;
  title: string;
  instruction: string;
  questions: Question[];
  totalMarks: number;
}

interface GeneratedPaper {
  id: string;
  assignmentId: string;
  title: string;
  subject: string;
  topic: string;
  gradeLevel: string;
  totalMarks: number;
  duration?: string;
  sections: Section[];
  createdAt: string;
}

function getBadgeStyle(difficulty: string) {
  switch (difficulty) {
    case 'easy':
      return { ...styles.difficultyBadge, ...styles.easyBadge };
    case 'medium':
      return { ...styles.difficultyBadge, ...styles.mediumBadge };
    case 'hard':
      return { ...styles.difficultyBadge, ...styles.hardBadge };
    default:
      return { ...styles.difficultyBadge, ...styles.easyBadge };
  }
}

interface PaperPDFDocumentProps {
  paper: GeneratedPaper;
  institutionName?: string;
  showAnswers?: boolean;
}

export function PaperPDFDocument({
  paper,
  institutionName = 'Your School / Institution Name',
  showAnswers = false,
}: PaperPDFDocumentProps) {
  const sectionQuestionStarts = paper.sections.map((_, index) =>
    1 + paper.sections.slice(0, index).reduce((sum, s) => sum + s.questions.length, 0)
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.institutionName}>{institutionName}</Text>
          <View style={styles.separator} />
          <Text style={styles.title}>{paper.title}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaItem}>
              Subject: <Text style={styles.metaBold}>{paper.subject}</Text>
            </Text>
            <Text style={styles.metaItem}>
              Grade: <Text style={styles.metaBold}>{paper.gradeLevel}</Text>
            </Text>
            <Text style={styles.metaItem}>
              Total Marks: <Text style={styles.metaBold}>{paper.totalMarks}</Text>
            </Text>
            {paper.duration && (
              <Text style={styles.metaItem}>
                Time: <Text style={styles.metaBold}>{paper.duration}</Text>
              </Text>
            )}
          </View>
        </View>

        <View style={styles.separator} />

        {/* Student Info */}
        <View style={styles.studentInfo}>
          <View style={styles.infoField}>
            <Text style={styles.infoLabel}>Name: </Text>
            <View style={styles.infoLine} />
          </View>
          <View style={styles.infoField}>
            <Text style={styles.infoLabel}>Roll No: </Text>
            <View style={{ ...styles.infoLine, width: 60 }} />
          </View>
          <View style={styles.infoField}>
            <Text style={styles.infoLabel}>Section: </Text>
            <View style={{ ...styles.infoLine, width: 40 }} />
          </View>
        </View>

        <View style={styles.separator} />

        {/* Sections */}
        {paper.sections.map((section, sectionIndex) => {
          const startNum = sectionQuestionStarts[sectionIndex];

          return (
            <View key={section.id}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionMarks}>{section.totalMarks} Marks</Text>
                <Text style={styles.sectionInstruction}>{section.instruction}</Text>
              </View>

              {section.questions.map((q, i) => (
                <View key={q.id} style={styles.question} wrap={false}>
                  <Text style={styles.questionNumber}>Q{startNum + i}.</Text>
                  <View style={styles.questionContent}>
                    <View style={styles.questionTextRow}>
                      <Text style={styles.questionText}>{q.text}</Text>
                      <View style={styles.questionMeta}>
                        <Text style={getBadgeStyle(q.difficulty)}>{q.difficulty}</Text>
                        <Text style={styles.marksText}>
                          [{q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}]
                        </Text>
                      </View>
                    </View>

                    {q.options &&
                      q.options.map((opt, oi) => (
                        <Text key={oi} style={styles.option}>
                          {String.fromCharCode(65 + oi)}. {opt.replace(/^[A-D]\.\s*/, '')}
                        </Text>
                      ))}

                    {(q.type === 'short_answer' || q.type === 'long_answer') && (
                      <View style={styles.answerLine} />
                    )}

                    {showAnswers && (
                      <Text style={styles.answer}>
                        Answer:{` `}
                        {q.correctAnswer != null &&
                        typeof q.correctAnswer === 'string' &&
                        q.correctAnswer.trim().length > 0
                          ? q.correctAnswer.trim()
                          : 'Not provided — open the answer key on screen or regenerate the paper.'}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          );
        })}

        {/* Footer */}
        <Text style={styles.footer}>*** End of Question Paper ***</Text>
      </Page>
    </Document>
  );
}
