import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "./StarRating";
import { Spinner } from "./Spinner";

interface RatingPopupProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (rating: number, feedback: string) => Promise<void>;
  targetName: string;
  targetRole: "driver" | "customer";
}

export function RatingPopup({
  open,
  onClose,
  onSubmit,
  targetName,
  targetRole,
}: RatingPopupProps) {
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(rating, feedback);
      onClose();
    } catch (error) {
      console.error("Failed to submit rating:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setRating(5);
      setFeedback("");
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" data-testid="rating-popup">
        <DialogHeader>
          <DialogTitle className="text-center">Rate Your {targetRole === "driver" ? "Driver" : "Customer"}</DialogTitle>
          <DialogDescription className="text-center">
            How was your experience with {targetName}?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div className="flex flex-col items-center gap-3">
            <StarRating
              rating={rating}
              size="lg"
              interactive
              onRatingChange={setRating}
            />
            <p className="text-sm text-muted-foreground">
              {rating === 5 && "Excellent!"}
              {rating === 4 && "Great!"}
              {rating === 3 && "Good"}
              {rating === 2 && "Fair"}
              {rating === 1 && "Poor"}
            </p>
          </div>

          {/* Feedback */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Feedback (optional)
            </label>
            <Textarea
              placeholder={`Share your experience with ${targetName}...`}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="h-24 resize-none"
              data-testid="input-feedback"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            data-testid="button-skip-rating"
          >
            Skip
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="min-w-[100px]"
            data-testid="button-submit-rating"
          >
            {isSubmitting ? <Spinner size="sm" /> : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
