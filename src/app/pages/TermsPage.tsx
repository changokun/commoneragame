import { Link } from "react-router";
import { Button } from "../components/ui/button";
import { ArrowLeft, FileText, Calendar, Gavel, CheckCircle, ShieldCheck } from "lucide-react";

/**
 * TermsPage Component
 * 
 * This page outlines the terms of service for Common Era.
 * It uses React Router's Link for client-side navigation.
 * 
 * @returns {JSX.Element} The rendered Terms of Service page
 */
export function TermsPage() {
  return (
    <div className="flex-1 flex flex-col">
      <div className="max-w-3xl w-full mx-auto space-y-8">

        {/* Hero section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Terms of Service
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Please read these terms carefully
          </p>
        </div>

        {/* Last updated notice */}
        <div className="bg-muted/50 rounded-lg p-4 text-center text-sm text-muted-foreground">
          <div className="inline-flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Last updated: September 23, 2026</span>
          </div>
        </div>

        {/* Main content */}
        <div className="space-y-10">
          
          {/* Introduction */}
          <section className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              These Terms of Service ("Terms", "Agreement") are an agreement between you ("you", "your") and 
              Common Era ("we", "us", "our") and govern your use of our website and services.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using our services, you agree to be bound by these Terms. If you disagree with any 
              part of the terms, then you may not access the services.
            </p>
          </section>

          {/* Acceptance of terms */}
          <section className="space-y-4">
            <div className="inline-flex items-center gap-2 text-primary">
              <h2 className="text-2xl font-bold">Acceptance of Terms</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              By using our services, you acknowledge that you have read these Terms, understand them, and agree 
              to be bound by them. If you do not agree to these Terms, you must not use our services.
            </p>
          </section>

          {/* User obligations */}
          <section className="space-y-4">
            <div className="inline-flex items-center gap-2 text-primary">
              <h2 className="text-2xl font-bold">User Obligations</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              You agree to use our services in compliance with all applicable laws and regulations. You are 
              solely responsible for your conduct and any data, text, information, or other material that you 
              submit, post, or display on or through our services.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              You agree not to:
            </p>
            <ul className="space-y-3 text-muted-foreground leading-relaxed list-disc list-inside">
              <li>Use our services for any illegal or unauthorized purpose</li>
              <li>Violate any applicable laws in your use of our services</li>
              <li>Engage in any conduct that restricts or inhibits anyone's use or enjoyment of our services</li>
              <li>Interfere with or disrupt our services or servers</li>
              <li>Attempt to gain unauthorized access to our services or related systems</li>
              <li>Use our services to transmit any viruses or other harmful code</li>
            </ul>
          </section>

          {/* Intellectual property */}
          <section className="space-y-4">
            <div className="inline-flex items-center gap-2 text-primary">
              <h2 className="text-2xl font-bold">Intellectual Property</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              All content included on our services, including but not limited to text, graphics, logos, button 
              icons, images, audio clips, digital downloads, data compilations, and software, is the property of 
              Common Era or its content suppliers and is protected by international copyright laws.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              You may not reproduce, modify, distribute, transmit, display, perform, publish, license, create 
              derivative works from, transfer, or sell any information, software, products, or services obtained 
              from our services without our prior written consent.
            </p>
          </section>

          {/* Disclaimer */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">Disclaimer</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our services are provided on an "as is" and "as available" basis. We disclaim all warranties of any 
              kind, whether express or implied, including but not limited to the implied warranties of 
              merchantability, fitness for a particular purpose, and non-infringement.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We do not warrant that our services will be uninterrupted, secure, or available at any particular 
              time or location. We are not responsible for any errors or omissions in our services or the 
              content and materials made available through our services.
            </p>
          </section>

          {/* Limitation of liability */}
          <section className="space-y-4">
            <div className="inline-flex items-center gap-2 text-primary">
              <h2 className="text-2xl font-bold">Limitation of Liability</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              To the fullest extent permitted by applicable law, Common Era, its directors, officers, employees, 
              and agents shall not be liable for any indirect, incidental, special, consequential, or punitive 
              damages, or any loss of profits or revenue, whether incurred directly or indirectly, or any loss of 
              data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or 
              inability to access or use our services; (ii) any conduct or content of any third party on our 
              services; (iii) any content obtained from our services; or (iv) unauthorized access, use, or 
              alteration of your transmissions or content.
            </p>
          </section>

          {/* Termination */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may terminate or suspend your access to our services immediately, without prior notice or 
              liability, for any reason whatsoever, including without limitation if you breach these Terms.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              All provisions of these Terms which by their nature should survive termination shall survive 
              termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity, 
              and limitations of liability.
            </p>
          </section>

          {/* Governing law */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms shall be governed and construed in accordance with the laws of the jurisdiction where 
              Common Era is based, without regard to its conflict of law provisions.
            </p>
          </section>

          {/* Changes to terms */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to amend these Terms at any time without notice. Your continued use of our services after such notice constitutes 
              your acceptance of the new Terms so review these terms periodically.
            </p>
          </section>

          {/* Contact us */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about these Terms, please contact us through our <a href="/contact">contact page</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}


