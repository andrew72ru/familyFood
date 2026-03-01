<?php declare(strict_types=1);

namespace App\Service;

use App\Dto\OpenAiResponseDto;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\Attribute\{AutoconfigureTag, Autowire};
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

#[AutoconfigureTag('monolog.logger', ['channel' => 'openai'])]
final readonly class OpenAiService
{
    private const string API_URL = 'https://api.openai.com/v1/responses';

    public function __construct(
        private HttpClientInterface $httpClient,
        private SerializerInterface $serializer,
        private LoggerInterface $openaiLogger,
        #[Autowire(param: 'env(OPENAI_KEY)')]
        private string $openAiApiKey,
        #[Autowire(param: 'env(OPENAI_PROMPT)')]
        private string $promptId,
        #[Autowire(param: 'env(OPENAI_PROMPT_VERSION)')]
        private string $promptVersion,
    ) {
    }

    public function getRecipeForDish(string $dishName): OpenAiResponseDto
    {
        $response = $this->httpClient->request('POST', self::API_URL, [
            'headers' => [
                'Authorization' => 'Bearer ' . $this->openAiApiKey,
                'Content-Type' => 'application/json',
            ],
            'json' => [
                'model' => 'gpt-4.1-mini',
                'prompt' => [
                    'id' => $this->promptId,
                    'version' => $this->promptVersion,
                    'variables' => [
                        'dish' => $dishName,
                    ],
                ],
            ],
        ]);

        $content = $response->getContent();

        $this->openaiLogger->info('OpenAI Response', [
            'dish' => $dishName,
            'response' => \json_decode($content, true),
        ]);

        return $this->serializer->deserialize($content, OpenAiResponseDto::class, 'json', [
            'allow_extra_attributes' => true,
        ]);
    }
}
