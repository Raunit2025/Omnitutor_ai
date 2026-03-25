"use client"
import { Position, Handle } from '@xyflow/react'
import React, { useState, useEffect } from 'react'
import type { NodeProps } from '@xyflow/react'
import type { TestNodeType } from '.'
import { Clock, Download, FileText } from 'lucide-react'
import { jsPDF } from 'jspdf'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const TestNode = ({ data }: NodeProps<TestNodeType>) => {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<string[]>(Array(data.questions.length).fill(''));
    const [testCompleted, setTestCompleted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(data.duration * 60); // Convert minutes to seconds
    const [results, setResults] = useState({
        correctAnswered: 0,
        incorrectAnswered: 0,
        skipped: 0
    });
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [analysisQuestion, setAnalysisQuestion] = useState(0);

    useEffect(() => {
        if (!testCompleted && timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        submitTest();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [testCompleted, timeLeft]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleAnswerSelect = (answer: string) => {
        const newAnswers = [...selectedAnswers];
        newAnswers[currentQuestion] = answer;
        setSelectedAnswers(newAnswers);
    };

    const nextQuestion = () => {
        if (currentQuestion < data.questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        }
    };

    const prevQuestion = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
        }
    };

    const submitTest = () => {
        let correct = 0;
        let incorrect = 0;
        let skipped = 0;

        selectedAnswers.forEach((answer, index) => {
            if (!answer) {
                skipped++;
            } else if (answer === data.questions[index]?.correctAnswer) {
                correct++;
            } else {
                incorrect++;
            }
        });

        setResults({
            correctAnswered: correct,
            incorrectAnswered: incorrect,
            skipped: skipped
        });
        setTestCompleted(true);
    };

    const resetTest = () => {
        setCurrentQuestion(0);
        setSelectedAnswers(Array(data.questions.length).fill(''));
        setTestCompleted(false);
        setTimeLeft(data.duration * 60);
        setResults({
            correctAnswered: 0,
            incorrectAnswered: 0,
            skipped: 0
        });
        setShowAnalysis(false);
    };

    const nextAnalysisQuestion = () => {
        if (analysisQuestion < data.questions.length - 1) {
            setAnalysisQuestion(analysisQuestion + 1);
        }
    };

    const prevAnalysisQuestion = () => {
        if (analysisQuestion > 0) {
            setAnalysisQuestion(analysisQuestion - 1);
        }
    };

    const downloadReport = () => {
        // Create PDF document
        const doc = new jsPDF();

        // Set up styling variables
        const titleFont = 16;
        const headingFont = 12;
        const normalFont = 10;
        const margin = 20;
        let yPos = margin;
        const lineHeight = 8;

        // Add title and header info
        doc.setFontSize(titleFont);
        doc.setFont("helvetica", "bold");
        doc.text(`Test Report: ${data.testName || "Test"}`, margin, yPos);
        yPos += lineHeight * 2;

        // Add test summary
        doc.setFontSize(headingFont);
        doc.text("Test Summary", margin, yPos);
        yPos += lineHeight;

        doc.setFontSize(normalFont);
        doc.setFont("helvetica", "normal");
        doc.text(`Level: ${data.level.charAt(0).toUpperCase() + data.level.slice(1)}`, margin, yPos);
        yPos += lineHeight;

        const score = Math.round((results.correctAnswered / data.questions.length) * 100);
        doc.text(`Score: ${score}%`, margin, yPos);
        yPos += lineHeight;

        doc.text(`Correct: ${results.correctAnswered}, Incorrect: ${results.incorrectAnswered}, Skipped: ${results.skipped}`, margin, yPos);
        yPos += lineHeight * 2;

        // Add questions section
        doc.setFontSize(headingFont);
        doc.setFont("helvetica", "bold");
        doc.text("Questions and Answers", margin, yPos);
        yPos += lineHeight * 1.5;

        // Add each question with details
        data.questions.forEach((q, index) => {
            // Check if we need a new page
            if (yPos > 250) {
                doc.addPage();
                yPos = margin;
            }

            doc.setFontSize(normalFont);
            doc.setFont("helvetica", "bold");
            doc.text(`Question ${index + 1}: ${q.question}`, margin, yPos);
            yPos += lineHeight;

            doc.setFont("helvetica", "normal");
            const optionsText = `Options: ${q.options.join(", ")}`;
            doc.text(optionsText, margin, yPos);
            yPos += lineHeight;

            const userAnswer = `Your Answer: ${selectedAnswers[index] || "Skipped"}`;
            doc.text(userAnswer, margin, yPos);
            yPos += lineHeight;

            // Highlight correct answer in green
            doc.setTextColor(0, 128, 0);
            doc.text(`Correct Answer: ${q.correctAnswer}`, margin, yPos);
            doc.setTextColor(0, 0, 0);
            yPos += lineHeight;

            // Add explanation with text wrapping
            const explanation = `Explanation: ${q.explanation || "No explanation provided"}`;
            const splitExplanation = doc.splitTextToSize(explanation, 170);
            doc.text(splitExplanation, margin, yPos);
            yPos += lineHeight * (splitExplanation.length + 1);
        });

        // Save the PDF
        doc.save(`${data.testName || "Test"}_Report.pdf`);
    };

    const progressPercentage = ((currentQuestion + 1) / data.questions.length) * 100;
    const analysisProgressPercentage = ((analysisQuestion + 1) / data.questions.length) * 100;

    // Map options to letters for the UI
    const letterOptions = ['A', 'B', 'C', 'D'];

    return (
        <Card className="rounded-lg p-6 w-[650px] bg-gray-100 relative">
            <div className="flex justify-between items-center  bg-white rounded-lg p-4">
                <h2 className="text-lg font-bold ">{data.testName || "Test"}</h2>

            </div>

            {!testCompleted ? (
                <div>


                    <div className="border bg-white rounded-lg p-4  min-h-[200px]">
                        <div className="flex gap-2 mb-6 bg-gray-100 p-3 rounded-md">
                            <div className=" text-black bg-[var(--color-lime)]/80 p-2  w-max min-w-max text-xs font-bold rounded-md  flex items-center justify-center">
                                Q {currentQuestion + 1}
                            </div>
                            <p className="text-black font-medium w-full">
                                {data.questions[currentQuestion]?.question}
                            </p>
                        </div>

                        <div className="flex flex-col gap-3">
                            {data.questions[currentQuestion]?.options.map((option, index) => {
                                if (index > 3) return null; // Limit to 4 options: A, B, C, D

                                const letter = letterOptions[index];
                                const isSelected = selectedAnswers[currentQuestion] === option;

                                return (
                                    <div
                                        key={index}
                                        className={`flex items-center justify-between gap-3 p-3 rounded-md cursor-pointer transition-all ${isSelected ? 'bg-gray-300 hover:bg-[#616161]' : 'bg-gray-100 hover:bg-[#616161]'
                                            }`}
                                        onClick={() => handleAnswerSelect(option)}
                                    >
                                        <div className="flex items-center gap-2">

                                            <span className={isSelected ? 'text-black' : 'text-black'}>
                                                {letter}
                                            </span>
                                            <span className={isSelected ? 'text-black' : 'text-black'}>
                                                {option}
                                            </span>
                                        </div>
                                        <div className="flex items-center">
                                            <div className={`flex items-center justify-center w-6 h-6 rounded-full  border-2 border-gray-700  ${isSelected ? 'border-black bg-gray-300' : 'border-black'
                                                }`}>
                                                {isSelected && (
                                                    <div className="w-3 h-3 rounded-full bg-[var(--color-purple)]"></div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="w-full bg-gray-400 rounded-full h-2 my-2">
                        <div
                            className="bg-[var(--color-purple)] h-2 rounded-full"
                            style={{ width: `${progressPercentage}%` }}
                        ></div>
                    </div>
                    <div className="flex justify-between">
                        {!testCompleted && (
                            <div className="flex items-center gap-2 bg-[var(--color-lime)] px-3 py-1 rounded-lg">
                                <Clock className="h-4 w-4" />
                                <span className="text-black">{formatTime(timeLeft)}</span>
                            </div>
                        )} <div className='flex gap-3'>
                            <Button
                                size={"lg"}
                                onClick={prevQuestion}
                                disabled={currentQuestion === 0}
                                variant="outline"
                            >
                                Previous
                            </Button>

                            <div className="flex gap-3">
                                {currentQuestion === data.questions.length - 1 ? (
                                    <Button
                                        size={"lg"}
                                        variant="lime"
                                        onClick={submitTest}
                                    >
                                        Submit
                                    </Button>
                                ) : (
                                    <Button
                                        size={"lg"}
                                        variant="purple"
                                        onClick={nextQuestion}
                                    >
                                        Next
                                    </Button>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            ) : !showAnalysis ? (
                <div>
                    <div className="bg-white rounded-lg p-6">
                        <h3 className="text-xl font-bold mb-4 text-black">Test Results</h3>

                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center">
                                <p className="text-green-600 text-2xl font-bold">{results.correctAnswered}</p>
                                <p className="text-green-700 text-sm">Correct</p>
                            </div>
                            <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-center">
                                <p className="text-red-600 text-2xl font-bold">{results.incorrectAnswered}</p>
                                <p className="text-red-700 text-sm">Incorrect</p>
                            </div>
                            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-center">
                                <p className="text-yellow-600 text-2xl font-bold">{results.skipped}</p>
                                <p className="text-yellow-700 text-sm">Skipped</p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <div className="w-full bg-gray-200 h-4 rounded-full overflow-hidden flex">
                                <div
                                    className="bg-green-500 h-full"
                                    style={{ width: `${(results.correctAnswered / data.questions.length) * 100}%` }}
                                ></div>
                                <div
                                    className="bg-red-500 h-full"
                                    style={{ width: `${(results.incorrectAnswered / data.questions.length) * 100}%` }}
                                ></div>
                                <div
                                    className="bg-yellow-500 h-full"
                                    style={{ width: `${(results.skipped / data.questions.length) * 100}%` }}
                                ></div>
                            </div>
                        </div>

                        <p className="text-black mb-6">
                            Score: <span className="font-bold text-[var(--color-purple)]">
                                {Math.round((results.correctAnswered / data.questions.length) * 100)}%
                            </span>
                        </p>

                        <div className="flex gap-3 mb-4">
                            <Button
                                onClick={() => setShowAnalysis(true)}
                                variant="lime"
                                size="lg"
                                className="flex-1 flex items-center justify-center gap-2"
                            >
                                <FileText className="h-4 w-4" />
                                Analyze Test
                            </Button>
                            <Button
                                onClick={downloadReport}
                                variant="outline"
                                size="lg"
                                className="flex-1 flex items-center justify-center gap-2"
                            >
                                <Download className="h-4 w-4" />
                                Download Report
                            </Button>
                        </div>

                        <Button
                            onClick={resetTest}
                            variant="outline"
                            size="lg"
                            className="w-full"
                        >
                            Retake Test
                        </Button>
                    </div>
                </div>
            ) : (
                <div>
                    <div className="flex justify-between items-center mb-4 bg-white rounded-lg p-4">
                        <h3 className="text-lg font-bold text-black">Test Analysis</h3>
                        <button
                            onClick={() => setShowAnalysis(false)}
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            Back to Results
                        </button>
                    </div>

                    <div className="border bg-white rounded-lg p-4 min-h-[200px]">
                        <div className="flex gap-2 mb-6 bg-gray-100 p-3 rounded-md">
                            <div className="text-black bg-[var(--color-lime)]/80 p-2 w-max min-w-max text-xs font-bold rounded-md flex items-center justify-center">
                                Q {analysisQuestion + 1}
                            </div>
                            <p className="text-black font-medium w-full">
                                {data.questions[analysisQuestion]?.question}
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 mb-4">
                            {data.questions[analysisQuestion]?.options.map((option, index) => {
                                if (index > 3) return null; // Limit to 4 options: A, B, C, D

                                const letter = letterOptions[index];
                                const isCorrect = option === data.questions[analysisQuestion]?.correctAnswer;
                                const isSelected = selectedAnswers[analysisQuestion] === option;
                                let className = "flex items-center justify-between gap-3 p-3 rounded-md transition-all";

                                if (isCorrect) {
                                    className += " bg-green-100 border-2 border-green-500";
                                } else if (isSelected && !isCorrect) {
                                    className += " bg-red-100 border-2 border-red-500";
                                } else {
                                    className += " bg-gray-100";
                                }

                                return (
                                    <div
                                        key={index}
                                        className={className}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-black">
                                                {letter}
                                            </span>
                                            <span className="text-black">
                                                {option}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {isCorrect && <span className="text-green-600 text-sm font-semibold">✓ Correct</span>}
                                            {isSelected && !isCorrect && <span className="text-red-600 text-sm font-semibold">✗ Your Answer</span>}
                                            <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 ${isCorrect
                                                ? 'border-green-500 bg-green-100'
                                                : isSelected
                                                    ? 'border-red-500 bg-red-100'
                                                    : 'border-gray-700'
                                                }`}>
                                                {(isCorrect || isSelected) && (
                                                    <div className={`w-3 h-3 rounded-full ${isCorrect ? 'bg-green-500' : 'bg-red-500'
                                                        }`}></div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-4 p-3 bg-gray-100 rounded-md">
                            <p className="text-gray-700 text-sm font-semibold mb-1">Explanation:</p>
                            <p className="text-black">
                                {data.questions[analysisQuestion]?.explanation || "No explanation provided."}
                            </p>
                        </div>
                    </div>

                    <div className="w-full bg-gray-400 rounded-full h-2 my-2">
                        <div
                            className="bg-[var(--color-purple)] h-2 rounded-full"
                            style={{ width: `${analysisProgressPercentage}%` }}
                        ></div>
                    </div>

                    <div className="flex justify-between">
                        <div className="flex gap-3">
                            <Button
                                size={"lg"}
                                onClick={prevAnalysisQuestion}
                                disabled={analysisQuestion === 0}
                                variant="outline"
                            >
                                Previous
                            </Button>

                            <div className="flex gap-3">
                                {analysisQuestion < data.questions.length - 1 ? (
                                    <Button
                                        size={"lg"}
                                        variant="purple"
                                        onClick={nextAnalysisQuestion}
                                    >
                                        Next
                                    </Button>
                                ) : (
                                    <Button
                                        size={"lg"}
                                        variant="lime"
                                        onClick={resetTest}
                                    >
                                        Retake Test
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                size={"lg"}
                                onClick={downloadReport}
                                variant="outline"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Download Report
                            </Button>

                            <Button
                                size={"lg"}
                                onClick={() => setShowAnalysis(false)}
                                variant="outline"
                            >
                                Back to Results
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <Handle
                type="source"
                position={Position.Right}
                className="!bg-purple-500 !border-2 !border-white"
            />
            <Handle
                type="target"
                position={Position.Left}
                className="!bg-blue-500 !border-2 !border-white"
            />
        </Card>
    )
}

export default TestNode