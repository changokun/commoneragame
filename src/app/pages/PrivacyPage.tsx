import { Link } from "react-router";
import { Button } from "../components/ui/button";
import { ArrowLeft, Shield, FileText, Calendar, User } from "lucide-react";

/**
 * PrivacyPage Component
 * 
 * This page outlines the privacy policy for Common Era.
 * It uses React Router's Link for client-side navigation.
 * 
 * @returns {JSX.Element} The rendered Privacy Policy page
 */
export function PrivacyPage() {
  return (
    <div className="flex-1 flex flex-col">
      <div className="max-w-3xl w-full mx-auto space-y-8">

        {/* Hero section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Your privacy is important to us
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
              Welcome to Common Era ("we", "our", "us"). We are committed to protecting your personal 
              information and your right to privacy. If you have any questions or concerns about our policy 
              or our practices with regards to your personal information, please <a href="/contact">contact us</a>.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              When you visit our website and use our services, you trust us with your personal information. 
              We take your privacy very seriously. In this privacy notice, we describe our privacy policy. 
              We seek to explain to you in the clearest way possible what information we collect, how we use 
              it, and what rights you have in relation to it.
            </p>
          </section>

          {/* Information we collect */}
          <section className="space-y-4">
            <div className="inline-flex items-center gap-2 text-primary">
              <FileText className="h-6 w-6" />
              <h2 className="text-2xl font-bold">Information We Collect</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              We collect personal information that you provide to us when you use our services, including:
            </p>
            <ul className="space-y-3 text-muted-foreground leading-relaxed list-disc list-inside">
              <li>
                <strong>Game Data:</strong> When you create or join games, we may collect information such as 
                your game preferences, scores, and gameplay statistics.
              </li>
              <li>
                <strong>Account Information:</strong> If you create an account, we collect your username and email address.
              </li>
              <li>
                <strong>Usage Data:</strong> Information about how you interact with our services, including 
                the pages you visit, the time and duration of your visits, and other diagnostic data.
              </li>
            </ul>
          </section>

          {/* How we use your information */}
          <section className="space-y-4">
            <div className="inline-flex items-center gap-2 text-primary">
              <User className="h-6 w-6" />
              <h2 className="text-2xl font-bold">How We Use Your Information</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              We use the information we collect or receive about you for the following purposes:
            </p>
            <ul className="space-y-3 text-muted-foreground leading-relaxed list-disc list-inside">
              <li>To provide, operate, and maintain our services</li>
              <li>To improve, personalize, and expand our services</li>
              <li>To understand and analyze how you use our services</li>
              <li>To develop new products, services, features, and functionality</li>
              <li>To communicate with you for customer service, including responding to your requests</li>
              <li>To send you updates and administrative messages</li>
            </ul>
          </section>

          {/* Data security */}
          <section className="space-y-4">
            <div className="inline-flex items-center gap-2 text-primary">
              <Shield className="h-6 w-6" />
              <h2 className="text-2xl font-bold">Data Security</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              We have implemented appropriate technical and organizational security measures designed to 
              protect the security of any personal information we process. However, please also remember 
              that we cannot guarantee that the internet itself is 100% secure. Although we will do our best 
              to protect your personal information, transmission of personal information to and from our 
              services is at your own risk. You should only access the services within a secure environment.
            </p>
          </section>

          {/* Children's privacy */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our services are not intended for use by children under 13 years of age. We do not knowingly 
              collect personal information from children under 13. If we learn that we have collected personal 
              information from a child under 13 without verification of parental consent, we will take steps to 
              delete such information as soon as possible.
            </p>
          </section>

          {/* Updates to this policy */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">Updates to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this privacy policy from time to time. The updated version will be indicated by an 
              updated "Last updated" date at the top of this page. We encourage you to review this privacy policy 
              periodically for any changes.
            </p>
          </section>

          {/* Contact us */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions or comments about this policy or our data practices, please contact us 
              through our <a href="/contact">contact page</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
