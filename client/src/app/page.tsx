"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  CheckCircle,
  BarChart3,
  Mail,
  Shield,
  Zap,
  ArrowRight,
  Star,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const features = [
  {
    icon: FileText,
    title: "Professional Invoices",
    description:
      "Create beautiful, customizable invoices in seconds with our intuitive editor.",
  },
  {
    icon: Mail,
    title: "Email Delivery",
    description:
      "Send invoices directly to clients with automatic email notifications.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description:
      "Track revenue, monitor payments, and gain insights into your business.",
  },
  {
    icon: CheckCircle,
    title: "Payment Tracking",
    description:
      "Mark invoices as paid, track overdue payments, and send reminders.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description:
      "Your data is encrypted and secure. We never share your information.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Built for speed. Create and send invoices in under a minute.",
  },
];

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Freelance Designer",
    content:
      "This app has transformed how I handle invoicing. I get paid faster and spend less time on admin work.",
    avatar: "S",
  },
  {
    name: "Michael Chen",
    role: "Small Business Owner",
    content:
      "The dashboard analytics help me understand my cash flow better than ever before.",
    avatar: "M",
  },
  {
    name: "Emily Davis",
    role: "Consultant",
    content:
      "Professional invoices, easy tracking, and great customer support. Highly recommended!",
    avatar: "E",
  },
];

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                InvoiceApp
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Sign in
              </Link>
              <Link href="/register" className="btn-primary">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 tracking-tight">
              Invoicing made <span className="text-primary-600">simple</span>
            </h1>
            <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto">
              Create professional invoices, track payments, and get paid faster.
              The all-in-one solution for freelancers and small businesses.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="btn-primary text-lg px-8 py-3 w-full sm:w-auto"
              >
                Start for Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link
                href="/login"
                className="btn-secondary text-lg px-8 py-3 w-full sm:w-auto"
              >
                Sign in to your account
              </Link>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              No credit card required. Free for basic use.
            </p>
          </div>

          {/* Hero Image/Preview */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 pointer-events-none"></div>
            <div className="bg-gray-900 rounded-xl shadow-2xl overflow-hidden border border-gray-800">
              <div className="bg-gray-800 px-4 py-3 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    {
                      label: "Total Revenue",
                      value: "$24,500",
                      color: "bg-green-500",
                    },
                    { label: "Invoices", value: "48", color: "bg-blue-500" },
                    { label: "Clients", value: "12", color: "bg-purple-500" },
                    { label: "Overdue", value: "$1,200", color: "bg-red-500" },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-white rounded-lg p-4 shadow-sm"
                    >
                      <div
                        className={`w-10 h-10 ${stat.color} rounded-lg mb-3`}
                      ></div>
                      <p className="text-sm text-gray-500">{stat.label}</p>
                      <p className="text-xl md:text-2xl font-bold text-gray-900">
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Everything you need to get paid
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Powerful features to streamline your invoicing workflow
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Loved by thousands
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              See what our customers have to say
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.name}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-gray-600 mb-6">
                  &quot;{testimonial.content}&quot;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-700">
                      {testimonial.avatar}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {testimonial.name}
                    </p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to streamline your invoicing?
          </h2>
          <p className="text-xl text-primary-100 mb-10 max-w-2xl mx-auto">
            Join thousands of businesses that trust InvoiceApp to manage their
            invoicing.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center bg-white text-primary-600 font-medium px-8 py-3 rounded-lg hover:bg-primary-50 transition-colors"
          >
            Get Started for Free
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">InvoiceApp</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-white transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Contact
              </a>
            </div>
            <p className="text-sm">
              &copy; {new Date().getFullYear()} InvoiceApp. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
